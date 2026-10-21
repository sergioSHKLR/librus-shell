// Post-build SEO: per-host overlays (dist/_hosts/<flavor>/) with host-branded
// index/404/library/book shells, robots.txt and sitemap.xml. Deploy copies the
// matching overlay over dist/ for each host repo.
import fs from "node:fs";
import path from "node:path";
const DIST = "dist";
const HOME = { doutrina: "https://doutrina.org", librus: "https://librus.app", centro: "https://centro.doutrina.org" };
const flavors = JSON.parse(fs.readFileSync("public/flavors.json", "utf8")).flavors;
const catalog = JSON.parse(fs.readFileSync("public/books/catalog.json", "utf8"));
const base = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
const robotsBase = fs.readFileSync(path.join(DIST, "robots.txt"), "utf8");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const today = new Date().toISOString().slice(0, 10);

function page(host, { lang, title, desc, canonical, type = "website" }) {
  const brand = flavors[host].brand;
  let h = base;
  h = h.replace(/<html lang="[^"]*"/, `<html lang="${lang}"`);
  h = h.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  h = h.replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(desc)}" />`);
  h = canonical
    ? h.replace(/<link rel="canonical" id="link-canonical" href="[^"]*" \/>/, `<link rel="canonical" id="link-canonical" href="${canonical}" />`)
    : h.replace(/\s*<link rel="canonical" id="link-canonical" href="[^"]*" \/>/, "");
  h = h.replaceAll("/manifest-librus.webmanifest", `/manifest-${host}.webmanifest`);
  h = h.replaceAll("/pwa/librus-apple-touch-icon.png", `/pwa/${host}-apple-touch-icon.png`);
  h = h.replace('<span data-i18n="library.title">LIBRUS</span>', `<span data-i18n="library.title">${esc(brand.name)}</span>`);
  const metas = [
    ["name", "apple-mobile-web-app-title", brand.name],
    ["property", "og:site_name", brand.name],
    ["property", "og:title", title],
    ["property", "og:description", desc],
    ["property", "og:type", type],
  ];
  if (canonical) metas.push(["property", "og:url", canonical]);
  h = h.replace("</head>", metas.map(([a, k, v]) => `    <meta ${a}="${k}" content="${esc(v)}" />\n`).join("") + "  </head>");
  return h;
}

const counts = {};
for (const host of Object.keys(HOME)) {
  const out = path.join(DIST, "_hosts", host);
  const write = (rel, s) => {
    const f = path.join(out, rel);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, s);
  };
  const brand = flavors[host].brand;
  const origin = HOME[host];
  const hostLang = host === "librus" ? "en" : "pt-BR";
  const shell = page(host, { lang: "pt-BR", title: brand.title || brand.name, desc: brand.description, canonical: `${origin}/library` });
  write("index.html", shell);
  write("404.html", page(host, { lang: "pt-BR", title: brand.title || brand.name, desc: brand.description, canonical: "" }));
  write("library.html", page(host, { lang: "pt-BR", title: `${brand.name} — ${hostLang === "en" ? "Library · Biblioteca" : "Biblioteca"}`, desc: brand.description, canonical: `${origin}/library` }));
  const urls = [`${origin}/library`];
  for (const b of catalog) {
    const home = HOME[(b.profiles || ["librus"])[0]] || HOME.librus;
    const pt = b.lang !== "en";
    const t = pt ? b.titlePt || b.title : b.title;
    const by = b.author + (b.year ? (pt ? ", " : " (") + b.year + (pt ? "" : ")") : "");
    const desc = pt
      ? `Leia ${t} (${by}) online — ${brand.name}: estudo, consulta e anotação.`
      : `Read ${t} by ${by} online — ${brand.name}: read, look up and annotate.`;
    const canonical = `${home}/books/${b.id}`;
    const html = page(host, { lang: pt ? "pt-BR" : "en", title: `${t} — ${b.author} · ${brand.name}`, desc, canonical, type: "book" });
    write(`books/${b.id}/index.html`, html);
    write(`books/${b.id}.html`, html);
    if (home === origin) urls.push(canonical);
  }
  write("robots.txt", robotsBase.replace(/^Sitemap: .*$/m, `Sitemap: ${origin}/sitemap.xml`));
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}\n</urlset>\n`);
  counts[host] = urls.length;
}
// Root dist = librus defaults (local preview); overlays win on deploy.
for (const f of ["index.html", "404.html", "library.html", "robots.txt", "sitemap.xml"])
  fs.copyFileSync(path.join(DIST, "_hosts/librus", f), path.join(DIST, f));
fs.cpSync(path.join(DIST, "_hosts/librus/books"), path.join(DIST, "books"), { recursive: true });

// Flag books that ship pages.json so the reader only fetches folio maps that exist
for (const f of fs.readdirSync(path.join(DIST, "books")).filter((n) => /^catalog.*\.json$/.test(n))) {
  const fp = path.join(DIST, "books", f);
  const list = JSON.parse(fs.readFileSync(fp, "utf8"));
  for (const b of list) {
    if (fs.existsSync(path.join(DIST, "books", b.id, "pages.json"))) b.folio = true;
    else delete b.folio;
  }
  fs.writeFileSync(fp, JSON.stringify(list, null, 2) + "\n");
}
console.log("[seo] sitemaps", JSON.stringify(counts));
