// 🟢 1. dotenv config सबभन्दा माथि हुन अनिवार्य छ!
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const http = require('http'); 
const cors = require('cors');

// 🟢 2. dotenv.config() पछि मात्र dbConnect require गर्ने
const { connectDB } = require('./config/dbConnect');

const path = require("path");
const multer = require("multer");
const { initSocket } = require("./utils/socket"); 

// 🟢 3. Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);
initSocket(server);

const allowedOrigins = [
  process.env.FRONTEND_MENU_URL,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

console.log("DATABASE_URL:", process.env.DATABASE_URL ? "FOUND" : "MISSING");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "FOUND" : "MISSING");
console.log("FRONTEND_MENU_URL:", process.env.FRONTEND_MENU_URL);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Routes ---
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/user", require("./routes/adminRoutes"));
app.use("/api/restaurants", require("./routes/restaurantRoutes"));
app.use("/api/branches", require("./routes/branchRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api", require("./routes/index"));
app.use("/api/ai", require('./routes/aiRoutes'));

// ── Global Error Handling Middleware ─────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File is too large! Maximum allowed size is 9MB.",
      });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  if (err) {
    const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
    return res.status(statusCode).json({
      error: err.message || "Something went wrong on the server.",
    });
  }

  next();
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Local Access: http://localhost:${PORT}`);
    console.log(`Network Access: http://192.168.x.x:${PORT}`); 
});