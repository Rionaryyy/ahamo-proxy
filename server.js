import express from "express";
import https from "https";
import { constants } from "crypto";

const app = express();

app.get("/proxy", (req, res) => {
  const target = req.query.url;
  if (!target) return res.status(400).send("url required");

  const agent = new https.Agent({
    secureOptions: constants.SSL_OP_LEGACY_SERVER_CONNECT
  });

  https.get(target, { agent }, (resp) => {
    let data = "";
    resp.on("data", (chunk) => (data += chunk));
    resp.on("end", () => res.send(data));
  }).on("error", (err) => {
    res.status(500).send(err.message);
  });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`proxy running on ${port}`));
