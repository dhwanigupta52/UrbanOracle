export default async function handler(req, res) {
  const { frames } = req.body;

  if (!frames || frames.length === 0) {
    return res.status(400).json({ result: "No frames received." });
  }

  const content = [
    {
      type: "text",
      text: "These are CCTV frames captured every 0.5 seconds. Analyze them for suspicious activity, violence, panic, or unusual behavior.",
    },
  ];

  // Add all frames as images
  frames.slice(0, 80).forEach((img) => {
    content.push({
      type: "input_image",
      image_url: img,
    });
  });

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: content,
          },
        ],
      }),
    });

    const data = await response.json();

    const resultText =
      data.output_text ||
      "AI could not analyze the frames properly.";

    res.status(200).json({ result: resultText });
  } catch (err) {
    res.status(500).json({ result: "AI Error: " + err.message });
  }
}
