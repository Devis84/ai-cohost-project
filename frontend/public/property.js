const PROPERTY_ID = "demo-property"; // per ora statico

async function saveProperty(data) {
  const { error } = await window.supabase
    .from("properties")
    .upsert({
      id: PROPERTY_ID,
      name: data.name,
      wifi_name: data.wifi_name,
      wifi_password: data.wifi_password,
      checkin: data.checkin,
      checkout: data.checkout,
      ai_knowledge: data.ai_knowledge
    });

  if (error) {
    console.error("Save error:", error);
    alert("Errore salvataggio");
  } else {
    console.log("Saved");
  }
}

async function loadProperty() {
  const { data, error } = await window.supabase
    .from("properties")
    .select("*")
    .eq("id", PROPERTY_ID)
    .single();

  if (error) {
    console.log("No existing data");
    return null;
  }

  return data;
}
