// Assembles the Vercel site in dist/: marketing pages at /, React app at /app.
// Run via `npm run build:site` (the React build has already written dist/app).
//
// For search engines, the marketing pages are also pre-rendered at build time:
//   /            English (text + FAQ/steps baked into the HTML, JSON-LD)
//   /ko/         Korean copy of the same pages, so crawlers that don't run
//                JavaScript (e.g. Naver) still see Korean text
//   sitemap.xml  lists both languages with hreflang alternates
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE = "https://fairfamily.site";
const SRC = path.join(__dirname, "..", "website");
const OUT = path.join(__dirname, "..", "dist");
// Old copies of the app build live in website/ — never ship them.
const SKIP = new Set(["app.html", "static", "asset-manifest.json"]);

const PAGES = {
  "index.html": {
    path: "",
    en: {
      title: "fairfamily — Free Parenting App to Raise Siblings Fairly",
      description:
        "Free parenting app that helps you treat every child fairly. Track time, money, gifts and attention for each kid, compare siblings by age, and get AI parenting tips to ease sibling rivalry.",
    },
    kr: {
      title: "페어패밀리 fairfamily — 아이들을 공평하게 키우는 무료 육아 앱",
      description:
        "첫째·둘째·셋째 모두 공평하게. 아이별로 함께한 시간, 용돈, 선물, 관심을 기록하고 같은 나이 때와 비교하며, AI 육아 코치가 형제 갈등과 질투 없이 키우는 방법을 알려주는 무료 육아 앱이에요.",
      keywords:
        "육아 앱, 무료 육아 앱, 공평한 육아, 형제 차별, 형제 갈등, 남매 갈등, 첫째 둘째, 다둥이 육아, 육아 기록, 육아 팁, 아이 잘 키우는 법, AI 육아 코치, 페어패밀리",
    },
  },
  "how-it-works.html": {
    path: "how-it-works.html",
    en: {
      title: "How fairfamily Works — Fair Parenting in 3 Simple Steps",
      description:
        "Add your children, log everyday moments, and get gentle AI parenting nudges. See how fairfamily helps you give every child equal love and attention.",
      keywords: "how to parent siblings fairly, fair parenting, parenting app, sibling rivalry, family tracker, AI parenting coach",
    },
    kr: {
      title: "페어패밀리 사용법 — 3단계로 시작하는 공평한 육아",
      description:
        "아이를 추가하고, 일상을 기록하고, AI 육아 코치의 조언을 받아보세요. 모든 아이에게 똑같은 사랑과 관심을 주는 공평한 육아 방법이에요.",
      keywords: "육아 앱 사용법, 공평한 육아, 형제 차별 없이 키우기, 육아 기록 앱, AI 육아 코치, 페어패밀리",
    },
  },
};

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Pulls the page's `var DATA = {...};` translation table out of its <script>.
function readData(html) {
  const m = html.match(/var DATA = (\{[\s\S]*?\n {2}\});/);
  if (!m) throw new Error("DATA block not found");
  return vm.runInNewContext(`(${m[1]})`);
}

// Replaces the text of every element carrying data-t="key" with t[key].
function applyText(html, t) {
  return html.replace(
    /(<([a-z0-9]+)\b[^>]*\bdata-t="([^"]+)"[^>]*>)([\s\S]*?)(<\/\2>)/g,
    (all, open, tag, key, _inner, close) => (typeof t[key] === "string" ? open + esc(t[key]) + close : all)
  );
}

function fillList(html, id, inner) {
  const re = new RegExp(`(<div[^>]*\\bid="${id}"[^>]*>)(</div>)`);
  if (!re.test(html)) throw new Error(`#${id} not found`);
  return html.replace(re, `$1${inner}$2`);
}

function prerenderLists(html, t) {
  if (t.kidNames) {
    for (const [kid, name] of Object.entries(t.kidNames)) {
      html = html.replace(new RegExp(`(class="kid-${kid}"[^>]*>)[^<]*(<)`), `$1${esc(name)}$2`);
    }
  }
  if (t.faq) {
    html = fillList(
      html,
      "faq-list",
      t.faq.map((f) => `<details class="faq-item"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")
    );
  }
  if (t.features) {
    html = fillList(
      html,
      "features-grid",
      t.features.map((f) => `<div class="fcard"><h3>${esc(f.title)}</h3><p>${esc(f.desc)}</p></div>`).join("")
    );
  }
  if (t.steps) {
    html = fillList(
      html,
      "steps",
      t.steps.map((s) => `<div class="step"><div><div class="num">${esc(s.num)}</div><h3>${esc(s.title)}</h3><p>${esc(s.desc)}</p></div></div>`).join("")
    );
  }
  return html;
}

function jsonLd(file, lang, t, meta, url) {
  const inLanguage = lang === "kr" ? "ko" : "en";
  const graph = [
    { "@type": "WebSite", "@id": `${BASE}/#website`, name: "fairfamily", alternateName: "페어패밀리", url: `${BASE}/`, inLanguage: ["en", "ko"] },
    {
      "@type": "SoftwareApplication",
      name: "fairfamily",
      alternateName: "페어패밀리",
      applicationCategory: "LifestyleApplication",
      applicationSubCategory: "Parenting",
      operatingSystem: "Web, Android",
      url: `${BASE}/app`,
      description: meta.description,
      inLanguage,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ];
  if (t.faq) {
    graph.push({
      "@type": "FAQPage",
      inLanguage,
      mainEntity: t.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }
  if (t.steps) {
    graph.push({
      "@type": "HowTo",
      name: meta.title,
      inLanguage,
      step: t.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.desc, url })),
    });
  }
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}

function setAttr(html, re, value) {
  if (!re.test(html)) throw new Error(`head tag not found: ${re}`);
  return html.replace(re, (tag) => tag.replace(/(content|href)="[^"]*"/, `$1="${esc(value)}"`));
}

function buildPage(file, src, lang) {
  const page = PAGES[file];
  const data = readData(src);
  const t = data[lang];
  const url = lang === "kr" ? `${BASE}/ko/${page.path}` : `${BASE}/${page.path}`;
  let html = src;

  if (lang === "kr") {
    const meta = page.kr;
    html = html.replace('<html lang="en">', '<html lang="ko">');
    html = applyText(html, t);
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(meta.title)}</title>`);
    html = setAttr(html, /<meta name="description"[^>]*>/, meta.description);
    html = setAttr(html, /<meta name="keywords"[^>]*>/, meta.keywords);
    html = setAttr(html, /<meta property="og:title"[^>]*>/, meta.title);
    html = setAttr(html, /<meta property="og:description"[^>]*>/, meta.description);
    html = setAttr(html, /<meta property="og:url"[^>]*>/, url);
    html = setAttr(html, /<link rel="canonical"[^>]*>/, url);
    html = html
      .replace('<meta property="og:locale" content="en_US" />', '<meta property="og:locale" content="ko_KR" />')
      .replace('<meta property="og:locale:alternate" content="ko_KR" />', '<meta property="og:locale:alternate" content="en_US" />');
    // /ko/ pages open in Korean unless the visitor explicitly picked English.
    html = html.replace("c==='en'?'en':deviceLang()", "c==='en'?'en':'kr'");
    html = html.replace('<button id="en" class="on"', '<button id="en"').replace('<button id="kr"', '<button id="kr" class="on"');
    html = html.replace("<!--LD-->", jsonLd(file, lang, t, meta, url));
  } else {
    if (page.en.keywords) html = setAttr(html, /<meta name="keywords"[^>]*>/, page.en.keywords);
    html = html.replace("<!--LD-->", jsonLd(file, lang, t, page.en, url));
  }
  return prerenderLists(html, t);
}

// Pages without a keywords tag in the source get one inserted before the Korean swap.
function ensureKeywords(src) {
  return /<meta name="keywords"/.test(src)
    ? src
    : src.replace(/(<meta name="description"[^>]*>)/, '$1\n<meta name="keywords" content="" />');
}

function sitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = Object.values(PAGES).flatMap((p) => {
    const en = `${BASE}/${p.path}`;
    const ko = `${BASE}/ko/${p.path}`;
    const alts =
      `    <xhtml:link rel="alternate" hreflang="en" href="${en}"/>\n` +
      `    <xhtml:link rel="alternate" hreflang="ko" href="${ko}"/>\n` +
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${en}"/>\n`;
    return [en, ko].map((loc) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n${alts}  </url>`);
  });
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    urls.join("\n") +
    "\n</urlset>\n"
  );
}

for (const name of fs.readdirSync(SRC)) {
  if (SKIP.has(name) || name.startsWith(".") || PAGES[name]) continue;
  fs.cpSync(path.join(SRC, name), path.join(OUT, name), { recursive: true });
}

fs.mkdirSync(path.join(OUT, "ko"), { recursive: true });
for (const file of Object.keys(PAGES)) {
  const src = ensureKeywords(fs.readFileSync(path.join(SRC, file), "utf8"));
  fs.writeFileSync(path.join(OUT, file), buildPage(file, src, "en"));
  fs.writeFileSync(path.join(OUT, "ko", file), buildPage(file, src, "kr"));
}
fs.writeFileSync(path.join(OUT, "sitemap.xml"), sitemap());

console.log("Site assembled in dist/ (landing at / and /ko/, app at /app)");
