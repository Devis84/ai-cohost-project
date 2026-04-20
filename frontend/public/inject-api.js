(function(){

  function loadScript(src){
    const s = document.createElement("script");
    s.src = src;
    document.body.appendChild(s);
  }

  window.addEventListener("DOMContentLoaded", () => {
    loadScript("api.js");
  });

})();
