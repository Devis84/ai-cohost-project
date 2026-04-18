(function () {
  const STORAGE_KEY = "LOGIN_ENABLED";

  function getState() {
    const val = localStorage.getItem(STORAGE_KEY);
    return val === null ? true : val === "true";
  }

  function setState(val) {
    localStorage.setItem(STORAGE_KEY, val);
    window.LOGIN_ENABLED = val;
  }

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

  const btnOn = document.createElement("button");
  btnOn.innerText = "ON";

  const btnOff = document.createElement("button");
  btnOff.innerText = "OFF";
  btnOff.style.marginLeft = "5px";

  function updateUI() {
    const state = getState();
    label.innerText = "Login: " + (state ? "ON" : "OFF");
    btnOn.style.opacity = state ? "1" : "0.5";
    btnOff.style.opacity = !state ? "1" : "0.5";
  }

  btnOn.onclick = () => {
    setState(true);
    updateUI();
  };

  btnOff.onclick = () => {
    setState(false);
    updateUI();
  };

  box.appendChild(label);
  box.appendChild(btnOn);
  box.appendChild(btnOff);

  document.addEventListener("DOMContentLoaded", () => {
    setState(getState());
    updateUI();
    document.body.appendChild(box);
  });
})();
