export const config = {
  api: {
    bodyParser: false,
  },
};

import fs from "fs";
import path from "path";
import formidable from "formidable";

export default async function handler(req, res) {
  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ result: "Upload error" });

    const videoPath = files.video.filepath;

    // For prototype: send a message to AI saying "video received"
    // (Next step we add frame extraction here)
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          input: "A CCTV video has been uploaded for analysis. Simulate analysis result for prototype.",
        }),
      });

      const data = await response.json();

      res.status(200).json({
        result: data.output_text || "AI analyzed the CCTV footage.",
      });
    } catch (e) {
      res.status(500).json({ result: "AI error: " + e.message });
    }
  });
}
