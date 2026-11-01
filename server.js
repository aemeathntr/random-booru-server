import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static("public"));

const TAGS = new Set(["ntr", "netorare", "cheating", "cuckolding"]);
const SOURCES = new Set(["danbooru", "gelbooru", "rule34"]);

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "RandomBooruSFW/1.0 (personal image browser)" },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`La fuente respondió HTTP ${response.status}`);
  return response.json();
}

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.post)) return data.post;
  if (Array.isArray(data?.posts)) return data.posts;
  return [];
}

async function fromDanbooru(tag) {
  const url = new URL("https://danbooru.donmai.us/posts.json");
  url.searchParams.set("tags", `${tag} rating:g`);
  url.searchParams.set("limit", "100");
  const posts = await fetchJson(url);
  return posts.map(p => ({
    image: p.large_file_url || p.file_url || p.preview_file_url,
    post: `https://danbooru.donmai.us/posts/${p.id}`,
    tags: p.tag_string || "",
    id: `danbooru-${p.id}`
  })).filter(p => p.image);
}

async function fromGelbooru(tag) {
  const url = new URL("https://gelbooru.com/index.php");
  for (const [k, v] of Object.entries({
    page: "dapi", s: "post", q: "index", json: "1",
    limit: "100", tags: `${tag} rating:safe`
  })) url.searchParams.set(k, v);
  const posts = asArray(await fetchJson(url));
  return posts.map(p => ({
    image: p.file_url,
    post: `https://gelbooru.com/index.php?page=post&s=view&id=${p.id}`,
    tags: p.tags || "",
    id: `gelbooru-${p.id}`
  })).filter(p => p.image);
}

async function fromRule34(tag) {
  const url = new URL("https://api.rule34.xxx/index.php");
  for (const [k, v] of Object.entries({
    page: "dapi", s: "post", q: "index", json: "1",
    limit: "100", tags: `${tag} rating:safe`
  })) url.searchParams.set(k, v);
  const posts = asArray(await fetchJson(url));
  return posts.map(p => ({
    image: p.file_url,
    post: `https://rule34.xxx/index.php?page=post&s=view&id=${p.id}`,
    tags: p.tags || "",
    id: `rule34-${p.id}`
  })).filter(p => p.image);
}

const providers = {
  danbooru: fromDanbooru,
  gelbooru: fromGelbooru,
  rule34: fromRule34
};

app.get("/api/random", async (req, res) => {
  const tag = String(req.query.tag || "").toLowerCase();
  const source = String(req.query.source || "all").toLowerCase();

  if (!TAGS.has(tag)) return res.status(400).json({ error: "Etiqueta no permitida." });
  if (source !== "all" && !SOURCES.has(source))
    return res.status(400).json({ error: "Fuente no permitida." });

  const selected = source === "all"
    ? [...SOURCES].sort(() => Math.random() - 0.5)
    : [source];

  const errors = [];
  for (const name of selected) {
    try {
      const posts = await providers[name](tag);
      if (!posts.length) {
        errors.push(`${name}: sin resultados`);
        continue;
      }
      const post = posts[Math.floor(Math.random() * posts.length)];
      return res.json({ ...post, source: name, searchedTag: tag });
    } catch (error) {
      errors.push(`${name}: ${error.message}`);
    }
  }
  res.status(502).json({
    error: "No se pudo obtener una publicación de las fuentes disponibles.",
    details: errors
  });
});

app.get("/health", (_req, res) => res.json({ ok: true }));
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Random Booru escuchando en el puerto ${PORT}`);
});
