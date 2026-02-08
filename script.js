const videoInput = document.getElementById("videoInput");
const videoPlayer = document.getElementById("videoPlayer");
const canvas = document.getElementById("graphCanvas");
const ctx = canvas.getContext("2d");
const aiResult = document.getElementById("aiResult");

let analyser, audioCtx, dataArray;

// ===== VIDEO SELECTED =====
videoInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    aiResult.innerText = "Preparing video...";

    videoPlayer.src = URL.createObjectURL(file);
    videoPlayer.load();

    // Start graph when video plays
    videoPlayer.onplay = startGraph;

    // Wait for metadata ONLY for frame extraction
    await new Promise(res => videoPlayer.onloadedmetadata = res);

    // Extract frames in background (does not block graph)
    const frames = await extractFrames(file);

    aiResult.innerText = "Analyzing video with AI...";

    try {
        const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ frames })
        });

        const data = await res.json();
        aiResult.innerText = data.analysis;

    } catch (err) {
        aiResult.innerText = "Error connecting to AI server!";
    }
});


// ===== AMPLITUDE GRAPH (LIVE AUDIO) =====
function startGraph() {
    audioCtx = new AudioContext();
    const source = audioCtx.createMediaElementSource(videoPlayer);

    analyser = audioCtx.createAnalyser();
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    analyser.fftSize = 2048;
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    drawGraph();
}

function drawGraph() {
    requestAnimationFrame(drawGraph);

    analyser.getByteTimeDomainData(dataArray);

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    let x = 0;
    const slice = canvas.width / dataArray.length;

    for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        ctx.strokeStyle = (v > 1.2 || v < 0.8) ? "red" : "lime";

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += slice;
    }

    ctx.stroke();
}


// ===== FRAME EXTRACTION (SEPARATE VIDEO ELEMENT) =====
async function extractFrames(file) {
    return new Promise((resolve) => {
        const tempVideo = document.createElement("video");
        tempVideo.src = URL.createObjectURL(file);

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const frames = [];

        tempVideo.onloadedmetadata = async () => {
            canvas.width = 320;
            canvas.height = 240;

            for (let t = 0; t < tempVideo.duration; t += 0.4) {
                tempVideo.currentTime = t;

                await new Promise(r => tempVideo.onseeked = r);

                ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
                frames.push(canvas.toDataURL("image/jpeg"));

                if (frames.length >= 50) break;
            }

            resolve(frames);
        };
    });
}

const toggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

toggle.addEventListener("click", () => {
    navLinks.classList.toggle("show");
});
