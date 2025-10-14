const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const { connectDBLVMS } = require("./config_mongo");
const userRoutes = require("./routes/customerRoutes");
const streamRoutes = require("./routes/streamRoutes");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});
// Make io available to routes via middleware
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({ origin: "*" }));

// Serve static files (for frontend)
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.use("/api/customer", userRoutes);       // ✅ User routes
// app.use("/api/stream", streamRoutes);   // ✅ Stream routes

// Start server
const PORT = process.env.PORT || 8081;
server.listen(PORT, async () => {
  await connectDBLVMS();
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
