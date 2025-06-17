document.addEventListener("DOMContentLoaded", () => {
  const statusText = document.getElementById("status");
  const captionText = document.getElementById("caption");

  // ✅ Full-screen tap detection
  document.body.style.cursor = "pointer";
  document.body.style.height = "100vh";
  document.body.style.margin = "0";

  // 📸 Camera start on any screen tap
  document.body.addEventListener("click", async () => {
    console.log("👆 Screen tapped, starting camera...");
    statusText.textContent = "Opening camera...";

    // 📱 Use MediaDevices API for full camera access
    const constraints = {
      video: {
        facingMode: "environment" // 👈 rear camera for mobile, webcam for laptop
      }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();

      const canvas = document.createElement("canvas");
      document.body.appendChild(video);

      // Wait for the video to load metadata
      await new Promise((resolve) => {
        video.onloadedmetadata = () => resolve();
      });

      setTimeout(async () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        stream.getTracks().forEach((track) => track.stop());
        video.remove();

        // 🖼️ Convert canvas to blob
        canvas.toBlob(async (blob) => {
          const formData = new FormData();
          formData.append("image", blob, "capture.jpg");

          statusText.textContent = "🧠 Sending image...";
          try {
            const response = await fetch("https://ksnp-test.hf.space/caption", {
              method: "POST",
              body: formData,
              mode: "cors"
            });

            const data = await response.json();
            if (!data.caption) throw new Error("No caption in response");

            captionText.textContent = data.caption;
            statusText.textContent = "✅ Caption received";
            speechSynthesis.speak(new SpeechSynthesisUtterance(data.caption));
          } catch (error) {
            console.error("Fetch error:", error);
            statusText.textContent = "❌ Caption fetch failed";
            captionText.textContent = "";
          }
        }, "image/jpeg");
      }, 2000); // wait 2 sec to stabilize camera
    } catch (err) {
      console.error("Camera access error:", err);
      statusText.textContent = "❌ Camera access failed";
    }
  });
});
