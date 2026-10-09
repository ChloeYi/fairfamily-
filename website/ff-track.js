// Remembers how a visitor first arrived (UTM tags or referring site), once per browser.
// The app reads it at sign-up and saves it on the new user's record (users/{uid}.acquisition).
(function () {
  try {
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
