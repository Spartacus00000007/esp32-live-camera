const express = require("express");
const app = express();

let latestFrame = null;

app.post("/upload", express.raw({ type: "image/jpeg", limit: "3mb" }), (req, res) => {
  latestFrame = req.body;
  res.sendStatus(200);
});

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
  }, 30);
  
  req.on("close", () => clearInterval(interval));
});

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>ESP32 Live Stream</title>
  <style>
    body { margin: 0; padding: 20px; background: #000; text-align: center; }
    h2 { color: #fff; }
    img { max-width: 100%; border: 2px solid #0f0; }
  </style>
</head>
<body>
  <h2>ESP32-S3 Live Camera</h2>
  <img src="/stream" width="640" />
</body>
</html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("ESP32 Camera Server - HTTP POST"));
