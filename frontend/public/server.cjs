require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/* =========================
   SAVE
========================= */
app.post('/save', async (req, res) => {
  try {

    console.log("SAVE DATA:", req.body);

    const { error } = await supabase
      .from('properties')
      .upsert(req.body, {
        onConflict: 'property_name'
      });

    if (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   LOAD
========================= */
app.get('/load/:property', async (req, res) => {
  try {

    const property = decodeURIComponent(req.params.property);

    console.log("LOAD:", property);

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('property_name', property)
      .maybeSingle();

    if (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.json({});
    }

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log('🚀 Backend running on 3001');
});
