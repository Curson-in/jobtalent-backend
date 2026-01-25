import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";

import fs from "fs";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import cron from "node-cron";
import { RESUME_DIR, AI_RESUME_DIR } from "./utils/storagePaths.js";
import fileRoutes from "./routes/file.routes.js";

/* ========= CORE CONFIG ========= */
import "./config/passport.js";

/* ========= ERROR HANDLER ========= */
import { errorHandler } from "./middleware/errorHandler.js";

/* ========= WORKERS / CRON ========= */
import { startJobScraperWorker } from "./workers/jobScraper.js";
import { syncBoostWithSubscription } from "./cron/syncBoostWithSubscription.js";

/* ========= ROUTES ========= */
// Auth
import authRoutes from "./routes/authRoutes.js";
import googleAuthRoutes from "./routes/googleAuthRoutes.js";
import passwordResetRoutes from "./routes/passwordResetRoutes.js";

// Core
import jobRoutes from "./routes/jobRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import employerRoutes from "./routes/employer.routes.js";
import cashfreeRoutes from "./routes/cashfree.routes.js";


// AI / Resume / Messages
import aiRoutes from "./routes/ai.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import messageRoutes from "./routes/message.routes.js";

// Subscription / Boost
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import boostRoutes from "./routes/boostRoutes.js";
import razorpayRoutes from "./routes/razorpay.routes.js";
import blogRoutes from "./routes/blog.routes.js";






/* ========= APP INIT ========= */
const app = express();

[RESUME_DIR, AI_RESUME_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/* =====================================================
   ✅ CORS — MUST BE FIRST (THIS FIXES YOUR ERROR)
===================================================== */
app.use(
  cors({
    origin: ["http://localhost:3000", "https://curson-one.vercel.app","https://www.curson.in",
  "https://curson-one.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* =====================================================
   ✅ WEBHOOK RAW BODY (ONLY FOR DODO)
===================================================== */

/* =====================================================
   ✅ NORMAL BODY PARSERS (AFTER WEBHOOK)
===================================================== */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* ========= SECURITY ========= */
app.use(helmet());
app.use(passport.initialize());

app.use(cookieParser());
/* =====================================================
   ROUTES
===================================================== */
app.use("/api", cashfreeRoutes);
// Payments (includes create-subscription + webhook)

// Auth
app.use("/api/auth", authRoutes);
app.use("/api/auth", googleAuthRoutes);
app.use("/api/auth", passwordResetRoutes);

// Jobs / Profile / Applications
app.use("/api/jobs", jobRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api", razorpayRoutes);


// Admin
app.use("/api/admin", adminRoutes);

// Employer
app.use("/api/employer", employerRoutes);

// AI / Resume / Messages
app.use("/api/ai", aiRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/messages", messageRoutes);

// Subscription & Boost
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/boosts", boostRoutes);

app.use("/api/files", fileRoutes);
app.use("/api", blogRoutes);





/* ========= HEALTH ========= */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

/* ========= ERROR HANDLING ========= */
app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});


/* ========= SERVER ========= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  startJobScraperWorker();
});

/* ========= CRON ========= */
// Safety: both interval + cron
setInterval(syncBoostWithSubscription, 60 * 60 * 1000);
cron.schedule("0 * * * *", syncBoostWithSubscription);

export default app;
