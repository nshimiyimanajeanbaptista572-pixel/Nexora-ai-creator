

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Ubu buryo bwo kohereza ntibwemerewe."
      })
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "GEMINI_API_KEY ntiyabonetse muri Netlify."
      })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const prompt = typeof body.prompt === "string"
      ? body.prompt.trim()
      : "";

    if (!prompt) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Banza wandike ikibazo cyawe."
        })
      };
    }

    if (prompt.length > 5000) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Ikibazo kirenze inyuguti 5000."
        })
      };
    }

    const geminiResponse = await fetch(
     "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "You are Nexora AI, a helpful assistant. Answer clearly and accurately. Reply in the language used by the user."
            }]
          },
          contents: [{
            role: "user",
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      }
    );

    const result = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Gemini API error:", result.error?.message);

      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Gemini yanze gusubiza. Reba API key, model, cyangwa API limits."
        })
      };
    }

    const text = (result.candidates?.[0]?.content?.parts || [])
      .map(part => part.text || "")
      .join("\n")
      .trim();

    if (!text) {
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Gemini ntiyagaruye igisubizo cyanditse."
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({ text: text })
    };
  } catch (error) {
    console.error("Function error:", error.message);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Habaye ikibazo kuri server. Ongera ugerageze."
      })
    };
  }
};
