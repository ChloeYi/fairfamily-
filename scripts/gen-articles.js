// Generates the reading articles (KO + EN) into website/guide/ from scripts/articles-*.js.
// Run: node scripts/gen-articles.js   (output is committed; the Vercel build does not run this)
const fs = require("fs");
const path = require("path");

const GUIDE = path.join(__dirname, "..", "website", "guide");
const BASE = "https://fairfamily.site";
const DATE = "2026-11-07";
const PLAY = "https://play.google.com/store/apps/details?id=com.fairfamily.journal";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const ko = [...require("./articles-ko"), ...require("./articles-ko2")];
const en = require("./articles-en");

const tpl = fs.readFileSync(path.join(GUIDE, "separation-anxiety.html"), "utf8");
const headTpl = tpl.slice(0, tpl.indexOf('<nav class="top">'));
const koNav = tpl.slice(tpl.indexOf('<nav class="top">'), tpl.indexOf("</nav>") + 6);
const koAsideTop = tpl.slice(tpl.indexOf('<aside class="side"'), tpl.indexOf("<h4>읽을거리</h4>"));
const guideCss = headTpl.includes("/guide/guide.css");
if (!guideCss) throw new Error("template head changed");

const enNav = `<nav class="top"><div class="wrap nav-in">
  <a href="/" class="logo"><img class="dot" src="/logo192.png" alt="" width="32" height="32"/>FairFamily</a>
  <div class="nav-r">
    <a class="lk" href="/guide/en-reading.html">Parenting articles</a>
    <a class="btn btn-primary" href="${PLAY}">Get the free app</a>
  </div>
</div></nav>`;

function head(lang, a) {
  const url = `${BASE}/guide/${a.slug}.html`;
  let h = headTpl;
  h = h.replace(/<html lang="[^"]*">/, `<html lang="${lang}">`);
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(a.title)} — FairFamily</title>`);
  h = h.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(a.desc)}" />`);
  h = h.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`);
  h = h.replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(a.title)} — FairFamily" />`);
  h = h.replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(a.desc)}" />`);
  h = h.replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`);
  h = h.replace(/<meta property="og:locale"[^>]*>/, `<meta property="og:locale" content="${lang === "ko" ? "ko_KR" : "en_US"}" />`);
  h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, "");
  const article = { "@context": "https://schema.org", "@type": "Article", headline: a.title, description: a.desc, inLanguage: lang, datePublished: DATE, dateModified: DATE, mainEntityOfPage: url, author: { "@type": "Organization", name: "FairFamily" }, publisher: { "@type": "Organization", name: "FairFamily" } };
  const faq = { "@context": "https://schema.org", "@type": "FAQPage", inLanguage: lang, mainEntity: a.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  const ld = [article, faq].map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`).join("\n");
  return h.replace("</head>", `${ld}\n</head>`);
}

function prose(a, lang) {
  const out = [];
  for (const s of a.sections) {
    out.push(`<h2>${esc(s.h)}</h2>`);
    if (s.p) s.p.forEach((p) => out.push(`<p>${esc(p)}</p>`));
    if (s.ul) out.push("<ul>\n" + s.ul.map((li) => `  <li>${esc(li)}</li>`).join("\n") + "\n</ul>");
  }
  out.push(`<h2>${lang === "ko" ? "자주 묻는 질문" : "Frequently asked questions"}</h2>`);
  a.faq.forEach((f) => out.push(`<p><strong>${esc(f.q)}</strong><br>${esc(f.a)}</p>`));
  out.push(
    `<p style="font-size:14.5px;color:var(--mute)">${
      lang === "ko"
        ? "이 글은 일반적인 육아 정보이며 의학적·심리학적 진단이나 상담을 대신하지 않아요. 걱정이 크다면 소아청소년과나 상담 전문가와 상의하세요."
        : "This article is general parenting information and is not medical or psychological advice or a diagnosis. If you are worried, talk to a pediatrician or a qualified counselor."
    }</p>`
  );
  return out.join("\n");
}

function relatedKo(cur) {
  const others = ko.filter((x) => x.slug !== cur.slug).slice(0, 4);
  return `<h2>함께 읽어 보세요</h2>\n<ul>\n${others.map((x) => `  <li><a href="/guide/${x.slug}.html">${esc(x.title)}</a></li>`).join("\n")}\n</ul>`;
}
function relatedEn(cur) {
  const others = en.filter((x) => x.slug !== cur.slug).slice(0, 4);
  return `<h2>Keep reading</h2>\n<ul>\n${others.map((x) => `  <li><a href="/guide/${x.slug}.html">${esc(x.title)}</a></li>`).join("\n")}\n</ul>`;
}

const koSide = koAsideTop + `<h4>읽을거리</h4>\n<a href="/guide/reading.html">📚 육아 읽을거리 모음</a>\n` + ko.map((x) => `<a href="/guide/${x.slug}.html">${x.icon} ${esc(x.title.split(":")[0].slice(0, 28))}</a>`).join("\n");
const enSide = `<aside class="side" aria-label="Articles"><h4>Parenting articles</h4>\n<a href="/guide/en-reading.html">📚 All articles</a>\n` + en.map((x) => `<a href="/guide/${x.slug}.html">${x.icon} ${esc(x.title.split(":")[0].slice(0, 42))}</a>`).join("\n");

function page(lang, a) {
  const ctaKo = `<div class="cta"><h2>지금 바로 해보세요</h2><p>무료이고, 구글 플레이에서 바로 설치할 수 있어요.</p><a class="btn" href="${PLAY}">무료로 설치하기</a></div>`;
  const ctaEn = `<div class="cta"><h2>Try it today</h2><p>FairFamily is a free parenting app. Track time, gifts and attention for each child and compare siblings at the same age.</p><a class="btn" href="${PLAY}">Get it free on Google Play</a></div>`;
  const crumb = lang === "ko" ? `<div class="crumb"><a href="/guide/index.html">사용법 가이드</a> › <a href="/guide/reading.html">육아 읽을거리</a></div>` : `<div class="crumb"><a href="/">FairFamily</a> › <a href="/guide/en-reading.html">Parenting articles</a></div>`;
  return (
    head(lang, a) +
    (lang === "ko" ? koNav : enNav) +
    `\n<div class="wrap">\n<div class="layout">${lang === "ko" ? koSide : enSide}</aside><main>${crumb}
<header class="head"><span class="eyebrow vi">${a.icon} ${lang === "ko" ? "육아 읽을거리" : "Parenting"}</span><h1>${esc(a.title)}</h1>
<p class="lede">${esc(a.lede)}</p></header>
<div class="prose">
${prose(a, lang)}
${lang === "ko" ? relatedKo(a) : relatedEn(a)}
</div>
${lang === "ko" ? ctaKo : ctaEn}</main></div>
</div>
<footer>© 2026 FairFamily${lang === "ko" ? " · 모든 아이를 위해 💗 마음을 담아" : " · For every child"}</footer>
<div class="legal"><a href="/privacy.html">${lang === "ko" ? "개인정보처리방침" : "Privacy"}</a> &nbsp;·&nbsp; <a href="/terms.html">${lang === "ko" ? "이용약관" : "Terms"}</a> &nbsp;·&nbsp; chloe.heydayii@gmail.com</div>
<div class="bottombar">
  <a href="${lang === "ko" ? "/guide/reading.html" : "/guide/en-reading.html"}"><span>📖</span><span>${lang === "ko" ? "읽을거리" : "Articles"}</span></a>
  <span class="divider"></span>
  <a href="${PLAY}"><span>🚀</span><span>${lang === "ko" ? "무료로 설치하기" : "Get the app"}</span></a>
</div>
</body>
</html>
`
  );
}

const cards = (list, lang) =>
  `<div class="cards">` +
  list.map((a) => `<a class="card" href="/guide/${a.slug}.html"><div class="ic">${a.icon}</div><span class="k">${lang === "ko" ? "육아 심리" : "Parenting"} · ${DATE}</span><h3>${esc(a.title)}</h3><p>${esc(a.lede)}</p></a>`).join("") +
  `</div>`;

for (const a of ko) fs.writeFileSync(path.join(GUIDE, `${a.slug}.html`), page("ko", a));
for (const a of en) fs.writeFileSync(path.join(GUIDE, `${a.slug}.html`), page("en", a));

// Korean hub: add cards once (idempotent via marker).
const hubPath = path.join(GUIDE, "reading.html");
let hub = fs.readFileSync(hubPath, "utf8");
hub = hub.replace(/<!--ff-new-start-->[\s\S]*?<!--ff-new-end-->/, "");
hub = hub.replace(/<p style="margin:18px 0"><a href="\/guide\/en-reading.html">[^<]*<\/a><\/p>/, "");
const koCards = ko.map((a) => cards([a], "ko").replace(/^<div class="cards">|<\/div>$/g, "")).join("");
const m = hub.match(/<\/div>(\s*)<div class="cta">/);
if (!m) throw new Error("hub cta not found");
hub = hub.replace(m[0], `<!--ff-new-start-->${koCards}<!--ff-new-end--></div>${m[1]}<div class="cta">`);
// link English hub from the Korean hub
if (!hub.includes("en-reading.html")) hub = hub.replace(/(<div class="cta">)/, `<p style="margin:18px 0"><a href="/guide/en-reading.html">📚 English articles for parents →</a></p>$1`);
fs.writeFileSync(hubPath, hub);

// English hub
const enHubA = { slug: "en-reading", title: "Parenting Articles: Siblings, Fairness and Raising Happy Kids", desc: "Free parenting articles about siblings, sibling rivalry, favoritism, single parents, stepfamilies and treating every child fairly.", lede: "Practical, general-information articles for parents raising more than one child.", faq: [{ q: "What is FairFamily?", a: "A free parenting app that helps parents treat every child fairly by tracking time, gifts and attention per child." }], icon: "📚", sections: [] };
let enHub = page("en", enHubA);
enHub = enHub.replace(/<div class="prose">[\s\S]*?<\/div>\n<div class="cta">/, `${cards(en, "en")}\n<div class="cta">`);
enHub = enHub.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, "").replace(/<meta property="og:type" content="article" \/>/, '<meta property="og:type" content="website" />');
fs.writeFileSync(path.join(GUIDE, "en-reading.html"), enHub);

console.log(`generated ${ko.length} ko + ${en.length} en + hub`);
