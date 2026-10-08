// Click-through mode for guide pages: one step at a time with ← / → buttons.
// Progressive enhancement — without JS every step is still shown in order.
(function () {
  var steps = Array.prototype.slice.call(document.querySelectorAll("main section.step"));
  if (steps.length < 2) return;

  var nextPage = document.querySelector(".pn a.nx");
  var cur = 0;

  var bar = document.createElement("div");
  bar.className = "stepper";
  bar.innerHTML =
    '<button type="button" class="sp-prev" aria-label="이전 단계">← 이전</button>' +
    '<div class="sp-dots" role="tablist"></div>' +
    '<button type="button" class="sp-next">다음 →</button>';
  var dots = bar.querySelector(".sp-dots");
  steps.forEach(function (s, i) {
    var d = document.createElement("button");
    d.type = "button";
    d.setAttribute("aria-label", (i + 1) + "단계");
    d.onclick = function () { show(i, true); };
    dots.appendChild(d);
  });

  var all = document.createElement("button");
  all.type = "button";
  all.className = "sp-all";
  all.textContent = "한 번에 모두 보기";

  steps[steps.length - 1].after(bar);
  bar.after(all);

  var prevBtn = bar.querySelector(".sp-prev");
  var nextBtn = bar.querySelector(".sp-next");

  function show(i, scroll) {
    cur = Math.max(0, Math.min(steps.length - 1, i));
    steps.forEach(function (s, k) { s.classList.toggle("sp-hidden", k !== cur); });
    Array.prototype.forEach.call(dots.children, function (d, k) { d.classList.toggle("on", k <= cur); });
    prevBtn.disabled = cur === 0;
    var last = cur === steps.length - 1;
    nextBtn.textContent = last ? (nextPage ? "다음 가이드 →" : "끝 ✓") : "다음 →";
    nextBtn.classList.toggle("sp-last", last);
    if (scroll) steps[cur].scrollIntoView({ behavior: "smooth", block: "start" });
    if (history.replaceState) history.replaceState(null, "", "#s" + (cur + 1));
  }

  prevBtn.onclick = function () { show(cur - 1, true); };
  nextBtn.onclick = function () {
    if (cur < steps.length - 1) return show(cur + 1, true);
    if (nextPage) window.location.href = nextPage.getAttribute("href");
  };
  all.onclick = function () {
    document.body.classList.add("sp-off");
    steps.forEach(function (s) { s.classList.remove("sp-hidden"); });
  };
  document.addEventListener("keydown", function (e) {
    if (document.body.classList.contains("sp-off")) return;
    if (e.key === "ArrowRight") nextBtn.click();
    if (e.key === "ArrowLeft" && cur > 0) prevBtn.click();
  });

  document.body.classList.add("sp-on");
  var m = /^#s(\d+)$/.exec(location.hash);
  show(m ? Number(m[1]) - 1 : 0, false);
})();
