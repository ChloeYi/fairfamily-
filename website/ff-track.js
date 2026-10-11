// Owner opt-out: open any page once with ?ff_me=1 on each phone/computer/browser
// to stop counting your own visits (Vercel Analytics + Google Analytics). ?ff_me=0 undoes it.
(function () {
  try {
    var q = new URLSearchParams(location.search);
    if (q.get("ff_me") === "1") localStorage.setItem("ff_me", "1");
    if (q.get("ff_me") === "0") localStorage.removeItem("ff_me");
    if (localStorage.getItem("ff_me") !== "1") return;
    window.FF_ME = true;
    // Vercel Web Analytics: drop every event before it is sent.
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    window.va("beforeSend", function () { return null; });
    // Google Analytics opt-out flag (must be set before gtag loads).
    window["ga-disable-G-FRRVEJHNBS"] = true;
    if (q.get("ff_me") === "1") {
      var n = document.createElement("div");
      n.textContent = "이 기기는 방문자 수에서 제외됩니다 ✓";
      n.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#222;color:#fff;padding:10px 16px;border-radius:999px;font:14px sans-serif;z-index:99999";
      var show = function () { document.body.appendChild(n); setTimeout(function () { n.remove(); }, 4000); };
      document.body ? show() : document.addEventListener("DOMContentLoaded", show);
    }
  } catch (e) {}
})();

// Remembers how a visitor first arrived (UTM tags or referring site), once per browser.
// The app reads it at sign-up and saves it on the new user's record (users/{uid}.acquisition).
(function () {
  try {
    if (window.FF_ME) return;
    var KEY = "ff_first_touch";
    if (localStorage.getItem(KEY)) return;
    var q = new URLSearchParams(location.search);
    var ref = document.referrer || "";
    var refHost = "";
    try { refHost = ref ? new URL(ref).hostname : ""; } catch (e) {}
    if (refHost === location.hostname) refHost = "";
    localStorage.setItem(KEY, JSON.stringify({
      source: q.get("utm_source") || refHost || "direct",
      medium: q.get("utm_medium") || (refHost ? "referral" : "none"),
      campaign: q.get("utm_campaign") || "",
      content: q.get("utm_content") || "",
      referrer: ref.slice(0, 300),
      landing: location.pathname,
      at: new Date().toISOString()
    }));
  } catch (e) {}
})();
