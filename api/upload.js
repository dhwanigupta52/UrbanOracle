export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method !== "POST") {
    return res.status(405).json({ analysis: "Method not allowed" });
  }

  try {
    const { frames } = req.body;

    if (!frames || frames.length === 0) {
      return res.status(400).json({ analysis: "No frames received" });
    }

    // 🔥 Only send first 20 images to AI (important for speed & limits)
    const sampleFrames = frames.slice(0, 20);

    const prompt = `
You are an AI security analyst.

These are frames extracted from a surveillance video.
Analyze for:
- panic
- crowd running
- abnormal activity
- possible danger signs

Give a short safety analysis.
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          { role: "user", content: prompt },
          ...sampleFrames.map((img) => ({
            role: "user",
            content: [
              {
                type: "input_image",
                image_url: img,
              },
            ],
          })),
        ],
      }),
    });

    const data = await response.json();

    const analysis =
      data.output_text ||
      "AI could not generate analysis. Check API key / limits.";

    res.status(200).json({ analysis });
  } catch (error) {
    res.status(500).json({ analysis: "Server error: " + error.message });
  }
}
