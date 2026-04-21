const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

// FILE STORAGE
const FILE = "memory.json";

// UTILITY: leggi file
function readData() {
  if (!fs.existsSync(FILE)) return {};
  return JSON.parse(fs.readFileSync(FILE));
}

// UTILITY: scrivi file
function writeData(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// ROOT TEST
app.get("/", (req, res) => {
  console.log("🔥 ROOT HIT");
  res.send("Backend OK");
});

// SAVE
app.post("/save", (req, res) => {
  try {
    const newData = req.body;

    if (!newData.property) {
      return res.status(400).json({ error: "Missing property" });
    }

    const db = readData();

    // salva per property
    db[newData.property] = newData;

    writeData(db);

    console.log("💾 SALVATO PER PROPERTY:", newData.property);

    res.json({ success: true });

  } catch (err) {
    console.error("❌ ERRORE:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET ALL (debug utile)
app.get("/data", (req, res) => {
  const db = readData();
  res.json(db);
});

app.listen(3001, () => {
  console.log("🚀 Backend running on 3001");
});
