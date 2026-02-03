export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ analysis: "Method not allowed" });
  }

  try {
    const { frames } = req.body;

    const prompt = `
You are a surveillance safety AI.
Analyze these frames for signs of panic, violence, or abnormal behavior.
Give a short safety report.
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          { role: "user", content: prompt },
          ...frames.map(img => ({
            role: "user",
            content: [{ type: "input_image", image_url: img }]
          }))
        ]
      })
    });

    const data = await response.json();

    res.status(200).json({
      analysis: data.output_text || "No analysis generated."
    });

  } catch (err) {
    res.status(500).json({ analysis: err.message });
  }
}
