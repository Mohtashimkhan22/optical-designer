import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { processOpticsData } from "./calculations.js";

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "5mb" }));

// Health check
app.get("/", (req, res) => {
  res.send("OpticsLab backend is running 🚀");
});

// API endpoint to process JSON
app.post("/process", (req, res) => {
  try {
    const sceneData = req.body.payload || req.body; // fallback
    console.log("📩 Received scene data:", JSON.stringify(sceneData, null, 2));

    if (!sceneData.components || !Array.isArray(sceneData.components)) {
      console.error("❌ Invalid scene data. Missing components array.");
      return res.status(400).json({ error: "Invalid scene data" });
    }

    const result = processOpticsData(sceneData);
    console.log("✅ Processed result:", result);
    res.json(result);
  } catch (err) {
    console.error("❌ Processing failed:", err);
    res.status(500).json({ error: "Processing failed" });
  }
});


const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
