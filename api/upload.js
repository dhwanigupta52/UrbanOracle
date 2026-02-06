export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ analysis: "Method not allowed" });
  }

  try {
    const { frames } = req.body;

    const prompt = `You are an AI surveillance system designed to AVOID false emergency alerts.

Your PRIMARY rule:
Do NOT recommend authority intervention unless the situation is clearly dangerous, life-threatening, or affects multiple people.

You must be CONSERVATIVE and NON-SENSITIVE in judgment.

Most unusual scenes in public places are normal human behavior and must NOT be escalated.

Only escalate if you clearly see:
• weapons
• fire, explosion, smoke
• physical assault with intent to harm
• unconscious person not moving
• stampede or crowd panic
• suspicious object that can harm many people

You MUST ignore and classify as "Mistaken Alarm" or "Low" for:
• a person falling but conscious
• elderly person stumbling or sitting down
• small fights, pushing, or arguments
• people running, shouting, or gathering
• minor injuries where the person can stand or is helped
• emotional distress, crying, or shouting
• anything involving only 1 person unless they are unconscious

Assume by default that the situation is safe unless STRONG evidence proves otherwise.

Respond STRICTLY in this format:

Summary:
(5-6 lines)

Threat Level:
False Alarm, Mistaken Alarm, Low, Medium, High

Strict rule for Threat Level:
False Alarm → Completely normal
Mistaken Alarm → Looks unusual but harmless
Low → Minor issue, self-resolvable, no authorities needed
Medium → Clear danger to a person, requires response
High → Severe danger to many people

Report To:
Police, Ambulance, Disaster Management, None

Reasoning:
(why this does NOT require escalation unless truly serious)

Remember:
Your job is to PREVENT unnecessary emergency responses.
When unsure, choose Mistaken Alarm.

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
