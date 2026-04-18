(function () {
  const box = document.createElement("div");
  box.style.position = "fixed";
  box.style.top = "20px";
  box.style.right = "20px";
  box.style.background = "white";
  box.style.padding = "10px 14px";
  box.style.borderRadius = "10px";
  box.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
  box.style.fontSize = "12px";
  box.style.zIndex = "9999";

  const label = document.createElement("span");
  label.innerText = "Login: ";

  const btnOn = document.createElement("button");
  btnOn.innerText = "ON";
  btnOn.onclick = () => {
    window.LOGIN_ENABLED = true;
    alert("Login ON");
  };

  const btnOff = document.createElement("button");
  btnOff.innerText = "OFF";
  btnOff.style.marginLeft = "5px";
  btnOff.onclick = () => {
    window.LOGIN_ENABLED = false;
    alert("Login OFF");
  };

  box.appendChild(label);
  box.appendChild(btnOn);
  box.appendChild(btnOff);

  document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(box);
  });
})();
