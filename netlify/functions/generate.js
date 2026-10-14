
exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json"
  };

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: "Please use POST."
      })
    };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "GEMINI_API_KEY is missing in Netlify."
        })
      };
    }

    const { prompt } = JSON.parse(event.body || "{}");

    if (typeof prompt !== "string" || !prompt.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Please enter a question."
        })
      };
    }

    const model = "gemini-2.5-flash";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt.trim()
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", data.error);

      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: data.error?.message || "Gemini request failed."
        })
      };
    }

    const answer = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!answer) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: "Gemini returned no answer."
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ answer })
    };
  } catch (error) {
    console.error("Function error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Unexpected server error."
      })
    };
  }
};
