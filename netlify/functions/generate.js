

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json"
  };

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Use POST" })
    };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "GEMINI_API_KEY is missing in Netlify environment variables."
        })
      };
    }

    const { prompt } = JSON.parse(event.body || "{}");

    if (!prompt || !String(prompt).trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Please enter a prompt." })
      };
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
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
                { text: String(prompt) }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error:
            data.error?.message ||
            `Gemini API request failed with status ${response.status}.`
        })
      };
    }

    const answer =
      data.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim() || "";

    if (!answer) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error:
            data.promptFeedback?.blockReason
              ? `The prompt was blocked: ${data.promptFeedback.blockReason}`
              : "Gemini returned no text. Please try another prompt."
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ answer })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || "Unexpected server error."
      })
    };
  }
};
