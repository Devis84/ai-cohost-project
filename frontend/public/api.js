
(async function(){

window.saveAll = async function(){

  const data = {

    property_name: document.getElementById("propertySelect").value,

    wifi_name: document.getElementById("wifiName").value,

    wifi_password: document.getElementById("wifiPass").value,

    checkin: document.getElementById("checkin").value,

    checkout: document.getElementById("checkout").value,

    description: document.getElementById("description").value,

    amenities: document.getElementById("amenities").value

  };

  const res = await fetch('http://localhost:3001/save', {

    method: 'POST',

    headers: { 'Content-Type': 'application/json' },

    body: JSON.stringify(data)

  });

  console.log(await res.json());

};

async function loadData(){

  const property = document.getElementById("propertySelect").value;

  const res = await fetch(`http://localhost:3001/load/${property}`);

  const data = await res.json();

  if(!data) return;

  document.getElementById("wifiName").value = data.wifi_name || "";

  document.getElementById("wifiPass").value = data.wifi_password || "";

  document.getElementById("checkin").value = data.checkin || "";

  document.getElementById("checkout").value = data.checkout || "";

  document.getElementById("description").value = data.description || "";

  document.getElementById("amenities").value = data.amenities || "";

}

document.addEventListener("DOMContentLoaded", () => {

  setTimeout(loadData, 500);

});

})();

