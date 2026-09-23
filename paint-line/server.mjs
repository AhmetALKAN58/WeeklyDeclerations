import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  clientIp,
  parseAllowNets,
  requestAllowed,
} from "./gate.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(path.join(__dirname, "..", "..", "logging_db", ".env"));
loadEnvFile(path.join(__dirname, ".env.local"));

const ALLOW_NETS = parseAllowNets(
  process.env.FORMS_ALLOW_IPS || process.env.STATION_ALLOW_IPS || "",
);

const PORT = Number(process.env.FORMS_PORT || 8512);
const HOST = process.env.FORMS_HOST || "0.0.0.0";
const PREFIX = "/paintline";
const ROOT = path.join(__dirname, "dist");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

const HOME = `<!doctype html>
<meta charset="utf-8">
<title>Forms</title>
<h1>Forms</h1>
<p><a href="${PREFIX}/">Paint line weekly report</a></p>
`;

function send(res, status, body, type, cache) {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": cache,
  });
  res.end(body);
}

function fileFor(urlPath) {
  const rel = decodeURIComponent(urlPath.slice(PREFIX.length + 1));
  const target = rel === "" ? "index.html" : rel;
  const file = path.normalize(path.join(ROOT, target));
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return null;
  return file;
}

function requestIp(req, peer) {
  return clientIp(
    peer,
    req.headers["cf-connecting-ip"],
    req.headers["x-forwarded-for"],
  );
}

const server = http.createServer((req, res) => {
  const peer = req.socket.remoteAddress?.replace(/^::ffff:/, "") || null;
  const url = new URL(req.url || "/", "http://127.0.0.1");
  if (url.pathname === "/api/health") {
    send(
      res,
      200,
      JSON.stringify({
        ok: true,
        app: "paintline",
        ip_locked: ALLOW_NETS.length > 0,
      }),
      "application/json",
      "no-store",
    );
    return;
  }
  const client = requestIp(req, peer);
  if (!requestAllowed(peer, client, ALLOW_NETS)) {
    send(res, 403, JSON.stringify({ error: "forbidden" }), "application/json", "no-store");
    return;
  }
  if (url.pathname === "/") {
    send(res, 200, HOME, "text/html; charset=utf-8", "no-cache");
    return;
  }
  if (url.pathname === PREFIX) {
    res.writeHead(302, { Location: `${PREFIX}/` });
    res.end();
    return;
  }
  if (!url.pathname.startsWith(`${PREFIX}/`)) {
    send(res, 404, "not found", "text/plain; charset=utf-8", "no-store");
    return;
  }

  let file = fileFor(url.pathname);
  if (!file || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(ROOT, "index.html");
  }
  if (!fs.existsSync(file)) {
    send(res, 404, "not found", "text/plain; charset=utf-8", "no-store");
    return;
  }
  const ext = path.extname(file);
  const hashed = url.pathname.includes("/assets/");
  const cache = hashed
    ? "public, max-age=31536000, immutable"
    : "no-cache";
  send(res, 200, fs.readFileSync(file), TYPES[ext] || "application/octet-stream", cache);
});

server.listen(PORT, HOST, () => {
  console.log(`forms listening on http://${HOST}:${PORT}${PREFIX}/`);
});
