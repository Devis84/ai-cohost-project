window.SUPABASE_URL = "https://mhmebkakdmwzqgteywvd.supabase.co";
window.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1obWVia2FrZG13enFndGV5d3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODg3ODksImV4cCI6MjA4ODc2NDc4OX0.85TrSsRElJ5-30BlUzfOLLymHHQKEbXuYr-4arpOzEY";

// 🔥 TOGGLE LOGIN
window.LOGIN_ENABLED = true;

window.supabase = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);
