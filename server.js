import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

console.log("Groq key loaded:", process.env.GROQ_API_KEY ? "YES" : "NO");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

function getCpuUsage() {
  const cpus = os.cpus();

  let idle = 0;
  let total = 0;

  cpus.forEach((cpu) => {
    for (let type in cpu.times) {
      total += cpu.times[type];
    }

    idle += cpu.times.idle;
  });

  return {
    idle,
    total
  };
}

let previousCpu = getCpuUsage();

app.get("/status", (req, res) => {
  const currentCpu = getCpuUsage();

  const idleDiff = currentCpu.idle - previousCpu.idle;
  const totalDiff = currentCpu.total - previousCpu.total;

  let cpuPercent = Math.round(100 - (100 * idleDiff) / totalDiff);

  if (isNaN(cpuPercent) || cpuPercent < 0) {
    cpuPercent = 0;
  }

  if (cpuPercent > 100) {
    cpuPercent = 100;
  }

  previousCpu = currentCpu;

  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  const ramPercent = Math.round((usedMemory / totalMemory) * 100);

  res.json({
    cpu: cpuPercent,
    ram: ramPercent
  });
});

app.post("/ask", async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: "Groq API key missing. Check .env file.",
      });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
  "You are JARVIS, a real AI assistant created and coded by Sreekar. If anyone asks who created you, who made you, or who built you, always answer: 'I was created and coded by Sreekar.' Do not mention Tony Stark, Iron Man, Marvel, or fiction unless the user specifically asks about the movie character. Give short and useful answers.",
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const reply = completion.choices[0]?.message?.content || "No response.";

    res.json({ reply });
  } catch (error) {
    console.error("GROQ ERROR:", error);

    res.status(500).json({
      error: error.message || "Unknown server error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`JARVIS running at http://localhost:${PORT}`);
});