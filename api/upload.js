export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ analysis: "Method not allowed" });
  }

  try {
    const { frames } = req.body;

    const prompt = `
You are an AI surveillance safety analyst reviewing CCTV frames.

Carefully observe the images and determine if there are signs of:
- panic
- violence
- distress
- abnormal or suspicious activity

Respond STRICTLY in the following format:

Summary:
(5-6 lines describing what is happening)

Threat Level:
Choose ONLY one from:
False Alarm, Mistaken Alarm, Low, Medium, High

Report To:
Choose one or more if required:
Police, Ambulance, Disaster Management, None

Reasoning:
(brief reason why you chose this threat level and teams)

Be precise and realistic like a real control room AI system.
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
            content: [
              { type: "input_text", text: prompt }   // ✅ FIXED HERE
            ]
          },
          ...frames.slice(0, 10).map(img => ({
            role: "user",
            content: [
              {
                type: "input_image",
                image_url: img
              }
            ]
          }))


        ]
      })
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      return res.status(500).json({
        analysis: "OpenAI Error: " + JSON.stringify(data)
      });
    }

    let analysis = "No analysis text returned.";

    for (const item of data.output) {
      if (item.content) {
        for (const c of item.content) {
          if (c.type === "output_text") {
            analysis = c.text;
          }
        }
      }
    }

    res.status(200).json({ analysis });

  } catch (err) {
    res.status(500).json({ analysis: "Server error: " + err.message });
  }
}
