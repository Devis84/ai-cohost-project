const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ================= SAVE =================
app.post("/save-property", async (req, res) => {

  try {

    const { property, data } = req.body;
    const clean = property.trim().toLowerCase();

    const { error } = await supabase
      .from("properties")
      .upsert({
        property_name: clean,
        data: data
      });

    if (error) {
      console.log("SAVE ERROR:", error);
      return res.status(500).json({ error });
    }

    console.log("Saved:", clean);

    res.json({ success: true });

  } catch (err) {
    console.log("SERVER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ================= LOAD =================
app.get("/load-property/:name", async (req, res) => {

  try {

    const clean = req.params.name.trim().toLowerCase();

    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("property_name", clean);

    if (error) {
      console.log("LOAD ERROR:", error);
      return res.status(500).json({ error });
    }

    if (!data || data.length === 0) {
      return res.json({ data: null });
    }

    console.log("Loaded:", clean);

    res.json(data[0]);

  } catch (err) {
    console.log("SERVER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ================= AI =================
app.post("/ai/parse-description", async (req, res) => {

  try {

    const text = req.body.text.toLowerCase();

    const result = {
      wifi: text.includes("wifi"),
      kitchen: text.includes("kitchen"),
      air_conditioning: text.includes("air"),
      washing_machine: text.includes("washing"),
      notes: text.slice(0, 200)
    };

    res.json({ result: JSON.stringify(result) });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log("🚀 Backend running on 3001");
});
