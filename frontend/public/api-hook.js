(function(){

function waitForSaveButton(){
  const btn = document.querySelector("button");

  if(!btn){
    setTimeout(waitForSaveButton, 500);
    return;
  }

  const original = btn.onclick;

  btn.onclick = async function(){

    const data = {
      property_name: document.getElementById("propertySelect")?.value || "",
      wifi_name: document.querySelector("input[placeholder='Network name']")?.value || "",
      wifi_password: document.querySelector("input[placeholder='Password']")?.value || "",
      checkin: document.querySelector("input[placeholder*='Check-in']")?.value || "",
      checkout: document.querySelector("input[placeholder*='Check-out']")?.value || "",
      description: document.querySelector("textarea")?.value || "",
      amenities: document.querySelectorAll("textarea")[1]?.value || ""
    };

    try{
      await fetch("http://localhost:3001/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      console.log("Saved to backend");
    }catch(e){
      console.error(e);
    }

    if(original) original();
  };
}

window.addEventListener("DOMContentLoaded", waitForSaveButton);

})();
