const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 CONFIG SUPABASE
const supabase = createClient(
  "https://YOUR_PROJECT.supabase.co",
  "YOUR_ANON_KEY"
);

// ============================
// GET PROPERTIES
// ============================
app.get("/properties", async (req, res) => {
  const { data, error } = await supabase
    .from("properties")
    .select("id, property_name");

  if (error) return res.status(500).json(error);

  res.json(data);
});

// ============================
// GET PROPERTY DATA
// ============================
app.get("/property/:id", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("property_info")
    .select("*")
    .eq("property_id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    return res.status(500).json(error);
  }

  res.json(data || {});
});

// ============================
// SAVE PROPERTY DATA
// ============================
app.post("/property/:id", async (req, res) => {
  const { id } = req.params;
  const payload = req.body;

  const { error } = await supabase
    .from("property_info")
    .upsert({
      property_id: id,
      name: payload.name || "",
      wifi_name: payload.wifiName || "",
      wifi_password: payload.wifiPass || "",
      checkin: payload.checkin || "",
      checkout: payload.checkout || "",
      ai_notes: payload.ai || "",
      rules: payload.rules || [],
      contacts: payload.contacts || []
    });

  if (error) return res.status(500).json(error);

  res.json({ success: true });
});

// ============================
// HEALTH CHECK
// ============================
app.get("/", (req, res) => {
  res.send("Backend OK");
});

app.listen(3001, () => {
  console.log("🚀 Backend running on 3001");
});
