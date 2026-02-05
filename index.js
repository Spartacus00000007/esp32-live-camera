const express = require("express");
const fs = require("fs");

const app = express();

// ESP32 JPEG gönderecek
app.use(express.raw({ type: "image/jpeg", limit: "5mb" }));

// Web sayfası ve last.jpg buradan servis edilecek
app.use(express.static(__dirname));

app.post("/upload", (req, res) => {
  fs.writeFileSync("last.jpg", req.body);
  res.send("OK");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server running on port " + port);
});
