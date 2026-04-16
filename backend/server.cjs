const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


// HEALTH CHECK
app.get('/', (req, res) => {
  res.send('Backend OK');
});


// 🔥 AI PARSER ENDPOINT
app.post('/ai/parse-description', async (req, res) => {
  try {
    const { text } = req.body;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `
Extract structured property data from Airbnb description.

Return ONLY JSON with:

{
  "wifi": true/false,
  "air_conditioning": true/false,
  "washing_machine": true/false,
  "parking": true/false,
  "workspace": true/false,
  "kitchen": true/false,
  "tv": true/false,
  "notes": "short summary"
}
          `
        },
        {
          role: "user",
          content: text
        }
      ]
    });

    const reply = completion.choices[0].message.content;

    res.json({ result: reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI failed' });
  }
});


app.listen(3001, () => {
  console.log("🚀 Backend running on 3001");
});
