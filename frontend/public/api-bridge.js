(function(){

function collectData(){
  return {
    property_name: document.getElementById("propertySelect")?.value || "",
    wifi_name: document.getElementById("wifiName")?.value || "",
    wifi_password: document.getElementById("wifiPass")?.value || "",
    checkin: document.getElementById("checkin")?.value || "",
    checkout: document.getElementById("checkout")?.value || "",
    description: document.getElementById("description")?.value || "",
    amenities: document.getElementById("amenities")?.value || ""
  };
}

function overrideSave(){

  const original = window.saveData;

  window.saveData = async function(){

    const data = collectData();

    try {
      const res = await fetch("http://localhost:3001/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const json = await res.json();
      console.log("SAVE RESPONSE:", json);

    } catch (err) {
      console.error("SAVE ERROR:", err);
    }

    if(original){
      original();
    }
  };
}

function loadData(){

  const property = document.getElementById("propertySelect")?.value;

  if(!property) return;

  fetch("http://localhost:3001/load/" + encodeURIComponent(property))
    .then(res => res.json())
    .then(data => {

      if(!data) return;

      document.getElementById("wifiName").value = data.wifi_name || "";
      document.getElementById("wifiPass").value = data.wifi_password || "";
      document.getElementById("checkin").value = data.checkin || "";
      document.getElementById("checkout").value = data.checkout || "";
      document.getElementById("description").value = data.description || "";
      document.getElementById("amenities").value = data.amenities || "";

    })
    .catch(err => console.error(err));
}

window.addEventListener("DOMContentLoaded", () => {

  overrideSave();

  setTimeout(loadData, 500);

  const select = document.getElementById("propertySelect");

  if(select){
    select.addEventListener("change", loadData);
  }

});

})();
