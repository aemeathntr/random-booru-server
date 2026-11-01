import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static("public"));

// Etiquetas individuales permitidas. Se pueden combinar en una búsqueda.
const ALLOWED_TAGS = new Set([
  "ntr",
  "netorare",
  "cheating",
  "cuckolding",
  "azur_lane",
  "mating_press",
  "impregnation",
  "interspecies",
  "genshin_impact",
  "zenless_zone_zero",
  "although_she_hurriedly_put_on_clothes_(meme)",
  "blue_archive",
  "mushoku_tensei",
  "eris_greyrat"
]);

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "RandomBooruSFW/1.0 (personal image and video browser)" },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`Danbooru respondió HTTP ${response.status}`);
  return response.json();
}

app.get("/api/random", async (req, res) => {
  const rawTags = String(req.query.tags || "").split(",").map(t => t.trim()).filter(Boolean);
  const uniqueTags = [...new Set(rawTags)];

  if (uniqueTags.some(tag => !ALLOWED_TAGS.has(tag))) {
    return res.status(400).json({ error: "Una o más etiquetas no están permitidas." });
  }

  try {
    const searchTags = [...uniqueTags, "rating:e"].join(" ");
    const url = new URL("https://danbooru.donmai.us/posts.json");
    url.searchParams.set("tags", searchTags);
    url.searchParams.set("limit", "100");

    const posts = await fetchJson(url);
    const results = posts.map(p => {
      const file = p.file_url || p.large_file_url || "";
      const ext = String(p.file_ext || file.split("?")[0].split(".").pop() || "").toLowerCase();
      const isVideo = ["webm", "mp4"].includes(ext);
      return {
        media: file,
        mediaType: isVideo ? "video" : "image",
        post: `https://danbooru.donmai.us/posts/${p.id}`,
        searchedTags: uniqueTags,
        id: `danbooru-${p.id}`
      };
    }).filter(p => p.media);

    if (!results.length) {
      return res.status(404).json({ error: "Danbooru no encontró archivos con esa combinación de etiquetas." });
    }

    const post = results[Math.floor(Math.random() * results.length)];
    return res.json({ ...post, source: "danbooru" });
  } catch (error) {
    return res.status(502).json({ error: `No se pudo consultar Danbooru: ${error.message}` });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Random Booru (Danbooru) escuchando en el puerto ${PORT}`);
});
