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

// Backup HUD shortener in case AI JSON fails
function makeFallbackHud(question, answer) {
  const q = (question || "").toLowerCase();

  if (q.includes("speed")) return "Speed = Distance / Time";
  if (q.includes("photosynthesis")) return "Plants make food\nusing sunlight.";
  if (q.includes("gravity")) return "Gravity pulls objects\ntowards Earth.";
  if (q.includes("force")) return "Force = Mass x\nAcceleration";
  if (q.includes("jarvis") && q.includes("full form")) {
    return "JARVIS:\nJust A Rather Very\nIntelligent System";
  }

  let clean = (answer || "")
    .replace(/\*/g, "")
    .replace(/#/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  let firstSentence = clean.split(/[.!?]/)[0].trim();

  if (firstSentence.length > 55) {
    firstSentence = firstSentence.substring(0, 52).trim() + "...";
  }

  return firstSentence || "No response.";
}

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
            `You are JARVIS, a real AI assistant created and coded by Sreekar.

If anyone asks who created you, who made you, or who built you, always answer:
"I was created and coded by Sreekar."

Do not mention Tony Stark, Iron Man, Marvel, or fiction unless the user specifically asks about the movie character.

You must return ONLY valid JSON in this exact format:
{
  "reply": "full useful answer for the main JARVIS screen",
  "hud": "very short answer for EDITH OLED"
}

Rules:
- "reply" can be 2-5 short sentences.
- "hud" must be extremely short, maximum 3 lines.
- HUD should be clear, not cut mid-word.
- HUD should avoid long paragraphs.
- For formulas, use formula format.
- For definitions, use 1 short sentence.
- Do not add markdown.
- Do not add text outside JSON.`,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content || "";

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      const fallbackReply = raw || "No response.";
      return res.json({
        reply: fallbackReply,
        hud: makeFallbackHud(userMessage, fallbackReply),
      });
    }

    const reply = parsed.reply || "No response.";
    const hud = parsed.hud || makeFallbackHud(userMessage, reply);

    res.json({
      reply,
      hud
    });

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