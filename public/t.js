/* Script de visitas do painel de métricas: sem cookies, sem dados pessoais. */
(function () {
  var s = document.currentScript;
  var key = s && s.getAttribute("data-site");
  if (!key) return;
  var endpoint = new URL(s.src).origin + "/api/collect";
  var last = null;

  function send() {
    var path = location.pathname;
    if (path === last) return;
    last = path;
    var body = JSON.stringify({ k: key, p: path, r: document.referrer, w: window.innerWidth });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon(endpoint, new Blob([body], { type: "text/plain" }));
      else fetch(endpoint, { method: "POST", body: body, keepalive: true, mode: "no-cors" });
    } catch (e) {}
  }

  // Sites do Framer navegam sem recarregar a página: acompanha a troca de rota.
  var push = history.pushState;
  history.pushState = function () {
    push.apply(this, arguments);
    setTimeout(send, 0);
  };
  window.addEventListener("popstate", send);
  send();
})();
