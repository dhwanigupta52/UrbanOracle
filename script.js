async function analyzeVideo() {
  const fileInput = document.getElementById("videoFile");
  const statusBox = document.getElementById("statusBox");

  if (!fileInput.files.length) {
    alert("Select a video first");
    return;
  }

  statusBox.innerText = "Uploading video to AI server...";

  const formData = new FormData();
  formData.append("video", fileInput.files[0]);

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    statusBox.innerText = data.message;
  } catch (err) {
    statusBox.innerText = "Error connecting to AI server!";
    console.error(err);
  }
}
