import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static("public"));

// Danbooru solamente. Las búsquedas se combinan con rating:e.
const TAGS = new Set([
  "ntr",
  "netorare",
  "cheating",
  "cuckolding",
  "netorare azur_lane",
  "netorare mating_press",
  "netorare impregnation"
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
  const tag = String(req.query.tag || "").toLowerCase().trim();
  if (!TAGS.has(tag)) {
    return res.status(400).json({ error: "Etiqueta no permitida." });
  }

  try {
    const url = new URL("https://danbooru.donmai.us/posts.json");
    url.searchParams.set("tags", `${tag} rating:e`);
    url.searchParams.set("limit", "100");

    const posts = await fetchJson(url);
    const results = posts.map(p => {
      const file = p.file_url || p.large_file_url || "";
      const ext = String(p.file_ext || file.split("?")[0].split(".").pop() || "").toLowerCase();
      const isVideo = ["webm", "mp4"].includes(ext);
      return {
        media: file,
        mediaType: isVideo ? "video" : "image",
        mimeType: isVideo ? (ext === "webm" ? "video/webm" : "video/mp4") : "",
        post: `https://danbooru.donmai.us/posts/${p.id}`,
        tags: p.tag_string || "",
        id: `danbooru-${p.id}`
      };
    }).filter(p => p.media && (!p.mediaType || p.mediaType === "image" || p.mediaType === "video"));

    if (!results.length) {
      return res.status(404).json({ error: "Danbooru no encontró archivos para esa combinación." });
    }

    const post = results[Math.floor(Math.random() * results.length)];
    return res.json({ ...post, source: "danbooru", searchedTag: tag });
  } catch (error) {
    return res.status(502).json({ error: `No se pudo consultar Danbooru: ${error.message}` });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Random Booru (Danbooru) escuchando en el puerto ${PORT}`);
});
