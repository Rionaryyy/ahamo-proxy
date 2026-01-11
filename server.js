import express from "express";
import https from "https";
import { constants } from "crypto";
import iconv from "iconv-lite";

const app = express();

app.get("/proxy", (req, res) => {
  const target = req.query.url;
  if (!target) return res.status(400).send("url required");

  const agent = new https.Agent({
    secureOptions: constants.SSL_OP_LEGACY_SERVER_CONNECT
  });

  https.get(target, { agent }, (resp) => {
    const chunks = [];

    resp.on("data", (chunk) => chunks.push(chunk));

    resp.on("end", () => {
      const buffer = Buffer.concat(chunks);

      // 1) Content-Type から charset を推定
      const contentType = resp.headers["content-type"] || "";
      let charset = null;

      const match = contentType.match(/charset=([^;]+)/i);
      if (match) {
        charset = match[1].toLowerCase();
      }

      // 2) Content-Type に charset が無い場合 → HTML 内の meta charset を探す
      if (!charset) {
        const ascii = buffer.toString("ascii"); // meta タグは ASCII 範囲で読める
        const metaMatch = ascii.match(/<meta[^>]*charset=["']?([^"'>\s]+)/i);
        if (metaMatch) {
          charset = metaMatch[1].toLowerCase();
        }
      }

      // 3) それでも無ければ UTF-8 として扱う
      if (!charset) {
        charset = "utf-8";
      }

      // 4) 正しい charset でデコード
      const decoded = iconv.decode(buffer, charset);

      res.send(decoded);
    });
  }).on("error", (err) => {
    res.status(500).send(err.message);
  });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`proxy running on ${port}`));
