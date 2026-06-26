import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import os from "os";
import Groq from "groq-sdk";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static("."));

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const MODES = {
  FRIDAY: {
    model: "llama-3.1-8b-instant",
    temperature: 0.35,
    max_tokens: 500,
    style: "You are FRIDAY, the fast lightweight assistant mode. Give short, direct, useful answers."
  },
  JARVIS: {
    model: "llama-3.3-70b-versatile",
    temperature: 0.55,
    max_tokens: 900,
    style: "You are JARVIS, the balanced assistant mode. Give clear, helpful answers with good reasoning but keep them readable."
  },
  ODYSSEY: {
    model: "llama-3.3-70b-versatile",
    temperature: 0.65,
    max_tokens: 1800,
    style: "You are ODYSSEY, the most powerful deep-work mode inside JARVIS. Use stronger reasoning, better structure, deeper debugging, planning, and high-quality explanations. Be practical and precise."
  }
};

function safeMode(mode) {
  const key = String(mode || "JARVIS").toUpperCase();
  return MODES[key] ? key : "JARVIS";
}

function cleanHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .filter(function (item) {
      return item && (item.role === "user" || item.role === "assistant") && item.content;
    })
    .slice(-12)
    .map(function (item) {
      return {
        role: item.role,
        content: String(item.content).slice(0, 3000)
      };
    });
}

function parseJsonAnswer(text) {
  try {
    const parsed = JSON.parse(text);
    return {
      reply: parsed.reply || text,
      hud: parsed.hud || String(parsed.reply || text).slice(0, 60)
    };
  } catch (error) {
    return {
      reply: text,
      hud: String(text).slice(0, 60)
    };
  }
}

app.get("/status", function (req, res) {
  const cpus = os.cpus();
  const freeMem = os.freemem();
  const totalMem = os.totalmem();

  const cpu = Math.floor(Math.random() * 40) + 10;
  const ram = Math.round(((totalMem - freeMem) / totalMem) * 100);

  res.json({
    cpu: cpu,
    ram: ram
  });
});

app.post("/ask", async function (req, res) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: "Groq API key missing"
      });
    }

    const message = String(req.body.message || "").trim();
    const modeKey = safeMode(req.body.mode);
    const mode = MODES[modeKey];
    const history = cleanHistory(req.body.history);
    const memory = String(req.body.memory || "").slice(0, 4000);

    if (!message) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const systemPrompt =
      mode.style + "\n\n" +
      "You are inside a web assistant created by Sreekar. " +
      "The system has three modes: FRIDAY fast, JARVIS balanced, and ODYSSEY powerful. " +
      "Do not claim Tony Stark created you unless the user asks fictional questions. " +
      "Use the saved memory only when useful. " +
      "Return ONLY valid JSON in this exact format: " +
      "{\"reply\":\"full useful answer for the main JARVIS chat screen\",\"hud\":\"very short answer for EDITH OLED\"}";

    const messages = [
      { role: "system", content: systemPrompt }
    ];

    if (memory) {
      messages.push({
        role: "system",
        content: "Saved user/project memory:\n" + memory
      });
    }

    history.forEach(function (item) {
      messages.push(item);
    });

    messages.push({
      role: "user",
      content: message
    });

    const completion = await groq.chat.completions.create({
      model: mode.model,
      messages: messages,
      temperature: mode.temperature,
      max_tokens: mode.max_tokens,
      response_format: { type: "json_object" }
    });

    const text = completion.choices?.[0]?.message?.content || "";
    const parsed = parseJsonAnswer(text);

    res.json({
      reply: parsed.reply,
      hud: parsed.hud,
      mode: modeKey,
      model: mode.model
    });
  } catch (error) {
    console.error("Ask error:", error);
    res.status(500).json({
      error: error.message || "AI server error"
    });
  }
});

app.post("/memory", async function (req, res) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: "Groq API key missing"
      });
    }

    const oldMemory = String(req.body.memory || "").slice(0, 4000);
    const history = cleanHistory(req.body.history).slice(-10);

    const memoryPrompt =
      "Update the assistant memory from this chat. " +
      "Save only useful long-term project facts, preferences, app decisions, and technical choices. " +
      "Do not save private emergency location, phone numbers, secrets, API keys, or temporary debugging noise. " +
      "Keep it concise in bullet points. Return only the updated memory text.";

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: memoryPrompt },
        { role: "user", content: "Old memory:\n" + oldMemory + "\n\nRecent chat:\n" + JSON.stringify(history) }
      ],
      temperature: 0.25,
      max_tokens: 500
    });

    const updatedMemory = completion.choices?.[0]?.message?.content || oldMemory;

    res.json({
      memory: updatedMemory
    });
  } catch (error) {
    console.error("Memory error:", error);
    res.status(500).json({
      error: error.message || "Memory update failed"
    });
  }
});

app.listen(PORT, function () {
  console.log("JARVIS server running on port " + PORT);
});
