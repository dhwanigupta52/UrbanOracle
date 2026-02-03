const videoInput = document.getElementById("videoInput");
const videoPlayer = document.getElementById("videoPlayer");
const canvas = document.getElementById("graphCanvas");
const ctx = canvas.getContext("2d");
const aiResult = document.getElementById("aiResult");

let audioCtx, analyser, source, dataArray;

videoInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    videoPlayer.src = URL.createObjectURL(file);
    videoPlayer.load();

    videoPlayer.onplay = () => startGraph();
    videoPlayer.onended = () => stopGraph();

    aiResult.innerText = "Analyzing video with AI...";

    const frames = await extractFrames(videoPlayer, 0.7);

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

function startGraph() {
    audioCtx = new AudioContext();
    source = audioCtx.createMediaElementSource(videoPlayer);
    analyser = audioCtx.createAnalyser();
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    analyser.fftSize = 2048;
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    draw();
}

function stopGraph() {
    audioCtx.close();
}

function draw() {
    requestAnimationFrame(draw);
    analyser.getByteTimeDomainData(dataArray);

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const sliceWidth = canvas.width / dataArray.length;
    let x = 0;

    ctx.beginPath();

    for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (v > 1.2 || v < 0.8) ctx.strokeStyle = "red";
        else ctx.strokeStyle = "lime";

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

        await new Promise(res => video.onseeked = res);

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg").split(",")[1];
        frames.push(base64);
    }

    return frames.slice(0, 25); // limit for API speed
}
