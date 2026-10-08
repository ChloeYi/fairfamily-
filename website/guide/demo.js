// Inline 3-tap demo of "한번에 적기" for the guide index (no sign-in needed).
(function () {
  var root = document.getElementById("demo");
  if (!root) return;
  var D = {
    label: "한번에 적기",
    text: "안나 수학학원 데려다주고, 지호랑 30분 레고함. 어제 안나 운동화 6만원",
    btn: ["✨ AI로 정리", "3개 모두 저장", "우리 아이들로 해보기 →"],
    hint: ["1단계 · 말하듯 적어요. 아이 여럿을 한 번에 적어도 돼요.",
           "2단계 · AI가 아이별·항목별로 나눴어요. 이름이 틀리면 눌러서 바꿔요.",
           "3단계 · 아이마다 저장됐어요. 대시보드 균형 그래프에 바로 반영돼요."],
    rows: [
      { av: 1, name: "안나", c: "#ff3d92", bg: "#ffe6f1", cat: "학교", what: "수학학원 데려다줌", val: "" },
      { av: 2, name: "지호", c: "#1f83f5", bg: "#e6f2ff", cat: "단둘이", what: "레고 함께함", val: "30분" },
      { av: 1, name: "안나", c: "#ff3d92", bg: "#ffe6f1", cat: "지출", what: "운동화", val: "₩60,000", when: "어제" }
    ],
    doneTitle: "3개 저장됐어요",
    doneSub: "안나 2개 · 지호 1개 — 대시보드에서 나란히 보여요."
  };
  var $ = function (id) { return document.getElementById(id); };
  var input = $("demoInput"), res = $("demoResult"), btn = $("demoBtn"), hint = $("demoHint"),
      label = $("demoLabel"), again = $("demoAgain"), dots = root.querySelectorAll(".demo-dots span");
  var timer = null, step = 0;
  function setStep(n) {
    step = n;
    Array.prototype.forEach.call(dots, function (x, i) { x.classList.toggle("on", i <= n); });
    hint.textContent = D.hint[n]; btn.textContent = D.btn[n];
    again.style.display = n === 2 ? "block" : "none";
  }
  function start() {
    clearInterval(timer);
    label.textContent = D.label; label.style.display = ""; input.style.display = ""; res.innerHTML = "";
    btn.classList.remove("pulse"); btn.disabled = true; setStep(0);
    var i = 0; input.innerHTML = '<span class="caret"></span>';
    timer = setInterval(function () {
      i += 1; input.innerHTML = D.text.slice(0, i) + '<span class="caret"></span>';
      if (i >= D.text.length) { clearInterval(timer); btn.disabled = false; btn.classList.add("pulse"); }
    }, 38);
  }
  btn.onclick = function () {
    if (step === 0) {
      clearInterval(timer);
      res.innerHTML = D.rows.map(function (r, k) {
        return '<div class="demo-row" style="animation-delay:' + (k * 0.18) + 's"><img src="/app/img/avatars/avatar-' + r.av + '.webp" alt="">' +
          '<div><span class="who" style="background:' + r.bg + ';color:' + r.c + '">' + r.name + '</span><div class="what">' + r.what + '</div>' +
          '<div class="meta">' + r.cat + (r.when ? " · " + r.when : "") + "</div></div>" + (r.val ? '<div class="val">' + r.val + "</div>" : "") + "</div>";
      }).join("");
      input.style.display = "none"; label.style.display = "none"; setStep(1);
    } else if (step === 1) {
      res.innerHTML = '<div class="demo-done"><div class="big">✅</div><b>' + D.doneTitle + "</b><p>" + D.doneSub + "</p></div>";
      setStep(2);
    } else { window.location.href = "/app"; }
  };
  again.onclick = start;
  start();
})();
