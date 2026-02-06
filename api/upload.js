export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ analysis: "Method not allowed" });
  }

  try {
    const { frames } = req.body;

    const prompt = `
You are an AI surveillance safety analyst reviewing CCTV frames from public places.

Your job is to detect ONLY situations that realistically require intervention from authorities.

Do NOT escalate minor everyday incidents.

Carefully observe the images and determine if there are CLEAR signs of:
- real panic in a crowd
- physical violence or assault
- medical emergency where the person cannot recover on their own
- fire, explosion, weapon, or disaster-like situation
- suspicious activity that can cause harm to many people

Ignore and classify as "Mistaken Alarm" cases such as:
- a person slipping or falling but conscious and able to move
- small arguments or verbal fights without physical harm
- people running normally
- minor injuries where the person stands up or is assisted by bystanders
- children crying, people shouting casually, or normal crowd noise
- elderly person walking slowly, sitting, or stumbling but stable

Respond STRICTLY in the following format:

Summary:
(5-6 lines describing what is happening)

Threat Level:
Choose ONLY one from:
False Alarm, Mistaken Alarm, Low, Medium, High

Threat Level Guide:
False Alarm → Nothing unusual at all
Mistaken Alarm → Looks unusual but no authority intervention needed
Low → Situation may grow but not dangerous yet
Medium → Clear danger to a person or small group, needs response
High → Dangerous situation affecting many people or life-threatening

Report To:
Choose one or more if required:
Police, Ambulance, Disaster Management, None

Reasoning:
(brief reason why you chose this threat level and teams)

Be realistic like a real control room AI that must avoid unnecessary emergency calls.
 
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
