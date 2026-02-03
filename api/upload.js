export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ analysis: "Method not allowed" });
  }

  try {
    const { frames } = req.body;

    const prompt = `
You are a CCTV safety AI.
Look at these frames and tell if there is panic, violence, or abnormal activity.
Give a short report.
`;

    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [{ type: "text", text: prompt }]
          },
          ...frames.slice(0, 10).map(img => ({
            role: "user",
            content: [
              { type: "input_image", image_url: img }
            ]
          }))
        ]
      })
    });

    const data = await openaiRes.json();

    // 🔥 If OpenAI returns an error, show it
    if (!openaiRes.ok) {
      return res.status(500).json({
        analysis: "OpenAI Error: " + JSON.stringify(data)
      });
    }

    // ✅ Safely extract text
    let analysis = "No analysis text returned.";

    if (data.output && data.output.length > 0) {
      for (const item of data.output) {
        if (item.content) {
          for (const c of item.content) {
            if (c.text) {
              analysis = c.text;
            }
          }
        }
      }
    }

    res.status(200).json({ analysis });

  } catch (err) {
    res.status(500).json({ analysis: "Server error: " + err.message });
  }
}
