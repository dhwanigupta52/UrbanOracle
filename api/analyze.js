export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).send("Method not allowed");
    }

    const { frames } = req.body;

    const messages = [
        {
            role: "user",
            content: [
                { type: "text", text: "Analyze these CCTV frames. Is there any violence, emergency, or suspicious activity?" },
                ...frames.map(img => ({
                    type: "image_url",
                    image_url: { url: img }
                }))
            ]
        }
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages,
            max_tokens: 300
        })
    });

    const data = await response.json();
    res.status(200).json({ analysis: data.choices[0].message.content });
}
