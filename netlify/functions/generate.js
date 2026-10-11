
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Use POST" })
    };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "API key is missing" })
      };
    }

    const { prompt } = JSON.parse(event.body || "{}");
    if (!prompt || !String(prompt).trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Enter a prompt" })
      };
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: String(prompt) }]
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: 502,
        body: JSON.stringify({
          error: data.error?.message || "Gemini request failed"
        })
      };
    }

    const answer = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "").join("") || "";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Something went wrong" })
    };
  }
};
