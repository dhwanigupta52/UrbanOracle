const btn = document.getElementById("analyzeBtn");
const fileInput = document.getElementById("videoInput");
const resultBox = document.getElementById("result");

btn.onclick = async () => {
  const file = fileInput.files[0];
  if (!file) return alert("Choose a video first!");

  resultBox.innerText = "Uploading video to AI server...";

  const formData = new FormData();
  formData.append("video", file);

  const response = await fetch("/api/analyze", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  resultBox.innerText = data.result;
};
