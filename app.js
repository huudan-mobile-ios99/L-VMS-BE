const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const appRouter = require("./router.js");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 8081;

// Create HTTP server and integrate with Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for Socket.IO
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({ origin: "*" })); // Allow all origins

// Serve static files (html, js, css) from /public
app.use(express.static(path.join(__dirname, "public")));

// Attach your existing API router
app.use("/api", appRouter);

// Load config
function loadConfig() {
  return JSON.parse(fs.readFileSync("config.json", "utf-8"));
}

// API to get config
app.get("/api/config", (req, res) => {
  res.json(loadConfig());
});

// API to update visibility
app.post("/api/visibility", (req, res) => {
  const config = loadConfig();
  config.visible = req.body.visible;
  fs.writeFileSync("config.json", JSON.stringify(config, null, 2));
  // Broadcast visibility update to all connected clients
  io.emit("visibilityUpdate", config.visible);
  res.json({ success: true, config });
});


// API to trigger refresh
app.post("/api/refresh", (req, res) => {
  // Broadcast refresh signal to all connected clients
  io.emit("refreshPage");
  res.json({ success: true, message: "Refresh signal sent to all clients" });
});

// API to update WebRTC URL
app.post("/api/url", (req, res) => {
  const config = loadConfig();
  config.webrtcUrl = req.body.webrtcUrl;
  fs.writeFileSync("config.json", JSON.stringify(config, null, 2));
  res.json({ success: true, config });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({ error: "Internal Server Error" });
});

// Start server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ V-LMS Node Running on http://localhost:${PORT}`);
});
