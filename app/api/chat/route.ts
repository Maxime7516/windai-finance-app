import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, pdfContext } = await req.json();

    if (!pdfContext) {
      return NextResponse.json({ error: "Le contenu du PDF est vide" }, { status: 400 });
    }

    const systemPrompt = `Tu es un assistant expert. Réponds aux questions en te basant sur ce document :
    
    ${pdfContext.substring(0, 15000)}
    
    CONSIGNES :
    - Sois précis et concis.
    - Si l'information n'est pas dans le texte, dis que tu ne sais pas.
    - Pas de gras (**), pas de hashtags (#), pas de tableaux.`;

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.2
      })
    });

    const data = await response.json();
    const cleanAnswer = data.choices[0].message.content.replace(/\*\*/g, "").replace(/#/g, "").trim();

    return NextResponse.json({ answer: cleanAnswer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}