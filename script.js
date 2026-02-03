async function analyzeVideo() {
  const fileInput = document.getElementById("videoFile");
  const status = document.getElementById("statusBox");

  if (!fileInput.files[0]) {
    alert("Please select a video first");
    return;
  }

  status.innerText = "Uploading video to AI server...";

  const formData = new FormData();
  formData.append("video", fileInput.files[0]);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  status.innerText = data.message + " | " + data.threat;
}
