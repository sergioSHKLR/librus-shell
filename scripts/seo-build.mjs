// Post-build SEO: prerender /library + /books/<id> shells, legacy redirect stubs, sitemap.
import fs from "node:fs";
import path from "node:path";
const DIST = "dist";
const HOME = { doutrina: "https://doutrina.org", librus: "https://librus.app", centro: "https://centro.doutrina.org" };
const BRAND = { doutrina: "DOUTRINA", librus: "LIBRUS", centro: "CENTRO" };
const tpl = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
const catalog = JSON.parse(fs.readFileSync("public/books/catalog.json", "utf8"));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
function page({ lang, title, desc, canonical }) {
  let h = tpl;
  h = h.replace(/<html lang="[^"]*"/, `<html lang="${lang}"`);
  h = h.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  h = h.replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(desc)}" />`);
  h = h.replace(/<link rel="canonical" id="link-canonical" href="[^"]*" \/>/, `<link rel="canonical" id="link-canonical" href="${canonical}" />`);
  for (const [k, v] of [["og:title", title], ["og:description", desc], ["og:url", canonical], ["og:type", "book"]])
    h = h.replace("</head>", `    <meta property="${k}" content="${esc(v)}" />\n  </head>`);
  return h;
}
function write(rel, html) {
  const f = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
}
// Library (flat file: /library has no directory, so Pages serves library.html with 200)
write("library.html", page({ lang: "pt-BR", title: "DOUTRINA — Biblioteca", desc: "DOUTRINA — estudo, consulta e anotação das obras básicas de Allan Kardec.", canonical: "https://doutrina.org/library" }));
const urls = ["https://doutrina.org/library"];
for (const b of catalog) {
  const prof = (b.profiles || ["librus"])[0];
  const home = HOME[prof] || HOME.librus;
  const pt = b.lang !== "en";
  const t = pt ? b.titlePt || b.title : b.title;
  const brand = BRAND[prof] || "LIBRUS";
  const by = b.author + (b.year ? (pt ? ", " : " (") + b.year + (pt ? "" : ")") : "");
  const desc = pt
    ? `Leia ${t} (${by}) online — ${brand}: estudo, consulta e anotação.`
    : `Read ${t} by ${by} online — ${brand}: annotate to assimilate.`;
  const canonical = `${home}/books/${b.id}`;
  const html = page({ lang: pt ? "pt-BR" : "en", title: `${t} — ${b.author} · ${brand}`, desc, canonical });
  write(`books/${b.id}/index.html`, html);
  write(`books/${b.id}.html`, html);
  if (home === HOME.doutrina) urls.push(canonical);
}
// Legacy static redirects (examples; 404.html head script maps whole families)
const redir = (to) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Redirecionando…</title><link rel="canonical" href="https://doutrina.org${to}"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=${to}"><script>location.replace(${JSON.stringify(to)})</script></head><body><a href="${to}">${to}</a></body></html>\n`;
const legacy = { "1lde/index.html": "/books/lde", "1lde/p5-01.html": "/books/lde", "2ldm/index.html": "/books/ldm", "old/3ese/075.html": "/books/ese", "3ese/index.html": "/books/ese", "4ceu/index.html": "/books/ceu", "5gen/index.html": "/books/gen", "assets/video/samaritano.html": "/books/ese" };
for (const [f, to] of Object.entries(legacy)) write(f, redir(to));
const today = new Date().toISOString().slice(0, 10);
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}\n</urlset>\n`);
console.log("[seo] sitemap", urls.length, "urls; books", catalog.length, "; legacy", Object.keys(legacy).length);
