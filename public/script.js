const videoUpload = document.getElementById("videoUpload");
const canvas = document.getElementById("graphCanvas");
const ctx = canvas.getContext("2d");
const aiResult = document.getElementById("aiResult");

videoUpload.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    const url = URL.createObjectURL(file);

    const video = document.createElement("video");
    video.src = url;
    video.crossOrigin = "anonymous";

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaElementSource(video);
    const analyser = audioCtx.createAnalyser();
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    let x = 0;

    function drawGraph() {
        requestAnimationFrame(drawGraph);
        analyser.getByteFrequencyData(dataArray);

        let amplitude = dataArray.reduce((a, b) => a + b) / dataArray.length;

        ctx.fillStyle = amplitude > 60 ? "red" : "black";
        ctx.fillRect(x, canvas.height - amplitude * 3, 2, amplitude * 3);

        x += 2;
        if (x > canvas.width) x = 0;
    }

    video.play();
    drawGraph();

    // Send to AI after small delay
    setTimeout(() => sendToAI(video), 4000);
});

async function sendToAI(video) {
    aiResult.innerText = "AI analyzing video frames...";

    const frames = [];
    const tempCanvas = document.createElement("canvas");
    const tctx = tempCanvas.getContext("2d");

    for (let t = 0; t < video.duration; t += 0.5) {
        video.currentTime = t;
        await new Promise(r => setTimeout(r, 200));

        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        tctx.drawImage(video, 0, 0);

        frames.push(tempCanvas.toDataURL("image/jpeg"));
        if (frames.length >= 20) break; // enough for demo
    }

    const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frames })
    });

    const result = await response.json();
    aiResult.innerText = result.analysis;
}
