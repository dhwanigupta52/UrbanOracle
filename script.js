const videoInput = document.getElementById("videoInput");
const canvas = document.getElementById("graphCanvas");
const ctx = canvas.getContext("2d");
const aiResult = document.getElementById("aiResult");

let audioContext;
let analyser;
let dataArray;

videoInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  aiResult.innerText = "Extracting frames and analyzing...";

  // ====== AUDIO GRAPH PART ======
  const video = document.createElement("video");
  video.src = URL.createObjectURL(file);
  video.crossOrigin = "anonymous";

  await video.play();

  audioContext = new AudioContext();
  const source = audioContext.createMediaElementSource(video);
  analyser = audioContext.createAnalyser();
  source.connect(analyser);
  analyser.connect(audioContext.destination);

  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  drawGraph();

  // ====== FRAME EXTRACTION PART ======
  const frames = await extractFrames(video, 0.5); // every 0.5 sec

  // ====== SEND TO VERCEL API ======
  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ frames }),
    });

    const result = await response.json();
    aiResult.innerText = result.analysis;
  } catch (err) {
    aiResult.innerText = "Error connecting to AI server!";
  }
});

function drawGraph() {
  requestAnimationFrame(drawGraph);
  analyser.getByteTimeDomainData(dataArray);

  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.lineWidth = 2;
  ctx.beginPath();

  const sliceWidth = canvas.width / dataArray.length;
  let x = 0;

  for (let i = 0; i < dataArray.length; i++) {
    const v = dataArray[i] / 128.0;
    const y = (v * canvas.height) / 2;

    // 🔴 Increased sensitivity
    if (v > 1.25 || v < 0.75) {
      ctx.strokeStyle = "red";
    } else {
      ctx.strokeStyle = "lime";
    }

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);

    x += sliceWidth;
  }

  ctx.stroke();
}

async function extractFrames(video, interval) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const frames = [];

  canvas.width = 320;
  canvas.height = 240;

  for (let t = 0; t < video.duration; t += interval) {
    video.currentTime = t;

    await new Promise((res) => {
      video.onseeked = res;
    });

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    frames.push(canvas.toDataURL("image/jpeg"));
  }

  return frames;
}
