const express = require("express");
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let latestFrame = null;
let clients = new Set();

// WebSocket bağlantıları
wss.on('connection', (ws) => {
  console.log('Yeni tarayıcı bağlandı');
  clients.add(ws);
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log('Tarayıcı ayrıldı');
  });
});

// ESP32 buraya JPEG gönderir
app.post("/upload", express.raw({ type: "image/jpeg", limit: "5mb" }), (req, res) => {
  latestFrame = req.body;
  
  // Tüm bağlı tarayıcılara anında gönder
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(latestFrame);
    }
  });
  
  res.sendStatus(200);
});

// MJPEG stream (yedek)
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
  }, 30); // Maksimum hız
  
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
    #canvas { max-width: 100%; border: 2px solid #fff; }
  </style>
</head>
<body>
  <h2>ESP32-S3 Live Camera (WebSocket - Ultra Hızlı)</h2>
  <canvas id="canvas"></canvas>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const ws = new WebSocket('wss://' + window.location.host);
    
    ws.binaryType = 'arraybuffer';
    
    ws.onmessage = (event) => {
      const blob = new Blob([event.data], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    };
    
    ws.onerror = () => console.error('WebSocket hatası!');
  </script>
</body>
</html>
  `);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`WebSocket sunucu çalışıyor - Port ${PORT}`));
