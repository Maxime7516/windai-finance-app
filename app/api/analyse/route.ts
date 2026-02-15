import { NextResponse } from "next/server";
const PDFParser = require("pdf2json");

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    // 1. On récupère la langue envoyée par le front-end (défaut 'fr')
    const lang = formData.get("lang") as string || "fr";

    if (!file) {
      return NextResponse.json({ error: lang === "fr" ? "Fichier PDF manquant" : "Missing PDF file" }, { status: 400 });
    }

    // EXTRACTION DU TEXTE
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const textContent: string = await new Promise((resolve, reject) => {
      const pdfParser = new (PDFParser as any)(null, 1);
      pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
      pdfParser.on("pdfParser_dataReady", () => resolve(pdfParser.getRawTextContent()));
      pdfParser.parseBuffer(buffer);
    });

    // 2. DICTIONNAIRE DE PROMPTS (Adaptation automatique)
    const prompts = {
      fr: `Tu es un analyste senior. Structure de réponse :
           1. NATURE ET CONTEXTE
           2. PRÉSENTATION DE LA SOCIÉTÉ
           3. SYNTHÈSE DES AXES MAJEURS
           4. Analyse DES COMPTES 
           5. CONCLUSION
           Ajoute [CHART_DATA] {"years": [], "revenue": [], "netIncome": []} [/CHART_DATA]`,
      
      en: `You are a senior analyst. Response structure:
           1. NATURE AND CONTEXT
           2. COMPANY OVERVIEW
           3. KEY STRATEGIC AXES
           4. TECHNICAL OR OPERATIONAL DETAILS
           5. REVENUE AND NET INCOME
           6. CONCLUSION
           Add [CHART_DATA] {"years": [], "revenue": [], "netIncome": []} [/CHART_DATA]`
    };

    const systemPrompt = prompts[lang as "fr" | "en"] + `
      CONSIGNES :
      - NO Bold (**), NO Hashtags (#).
      - Titles in UPPERCASE.
      - Stay factual.`;

    // 3. APPEL MISTRAL
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}` 
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this: ${textContent.substring(0, 15000)}` }
        ],
        temperature: 0.1 
      })
    });

    const data = await response.json();
    const fullContent = data.choices[0].message.content;

    // 4. NETTOYAGE (Identique à ton code)
    const chartMatch = fullContent.match(/\[CHART_DATA\]([\s\S]*?)\[\/CHART_DATA\]/);
    let chartData = null;
    let cleanResponse = fullContent.replace(/\[CHART_DATA\][\s\S]*?\[\/CHART_DATA\]/, "");

    if (chartMatch) {
      try { chartData = JSON.parse(chartMatch[1].trim()); } catch (e) { console.error(e); }
    }

    cleanResponse = cleanResponse.replace(/\*\*/g, "").replace(/#/g, "").trim();

    return NextResponse.json({ 
      analysis: cleanResponse,
      chartData: chartData,
      rawText: textContent 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}