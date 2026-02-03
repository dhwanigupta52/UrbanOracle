const fileInput = document.getElementById("videoInput");
const resultBox = document.getElementById("result");

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  resultBox.innerText = "Extracting frames from video...";

  const frames = await extractFrames(file);

  resultBox.innerText = `Extracted ${frames.length} frames. Sending to AI...`;

  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ frames }),
  });

  const data = await response.json();
  resultBox.innerText = data.result;
});

async function extractFrames(file) {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const frames = [];
    video.src = URL.createObjectURL(file);
    video.crossOrigin = "anonymous";

    video.addEventListener("loadedmetadata", async () => {
      const duration = video.duration;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      for (let t = 0; t < duration; t += 0.5) {
        await seekVideo(video, t);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg");
        frames.push(base64);
      }

      resolve(frames);
    });
  });
}

function seekVideo(video, time) {
  return new Promise((resolve) => {
    video.currentTime = time;
    video.onseeked = () => resolve();
  });
}
