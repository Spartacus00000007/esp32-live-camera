const express = require("express");
const app = express();
let latestFrame = null;

// ESP32 buraya JPEG gönderir
app.post("/upload", express.raw({ type: "image/jpeg", limit: "2mb" }), (req, res) => {
  latestFrame = req.body;
  res.sendStatus(200);
});

// Tarayıcı buradan izler
app.get("/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "multipart/x-mixed-replace; boundary=frame",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });
  
  const interval = setInterval(() => {
    if (!latestFrame) return;
    res.write("--frame\r\n");
    res.write("Content-Type: image/jpeg\r\n");
    res.write(`Content-Length: ${latestFrame.length}\r\n\r\n`);
    res.write(latestFrame);
    res.write("\r\n");
  }, 33); // 30 FPS için 33ms (100ms yerine)
  
  req.on("close", () => clearInterval(interval));
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("MJPEG server running at 30 FPS"));
