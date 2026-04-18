console.log("AUTH SCRIPT LOADED");

const supabase = window.supabase.createClient(
  "https://mhmebkakdmwzqgteywyd.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1obWVia2FrZG13enFndGV5d3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODg3ODksImV4cCI6MjA4ODc2NDc4OX0.85TrSsRElJ5-30BlUzfOLLymHHQKEbXuYr-4arpOzEY"
);

async function handleAuth() {

  console.log("START AUTH");

  try {

    const { data, error } = await supabase.auth.getSessionFromUrl({
      storeSession: true
    });

    console.log("RESULT:", data, error);

    if (error) {
      document.getElementById("status").innerText = "❌ Auth error";
      return;
    }

    if (data.session) {
      document.getElementById("status").innerText = "✅ Logged in";

      setTimeout(() => {
        window.location.href = "/host.html";
      }, 800);

    } else {
      document.getElementById("status").innerText = "❌ No session";

      setTimeout(() => {
        window.location.href = "/login.html";
      }, 1000);
    }

  } catch (err) {
    console.error("CRASH:", err);
    document.getElementById("status").innerText = "❌ Crash";
  }
}

window.addEventListener("load", handleAuth);
