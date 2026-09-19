import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../dist/", import.meta.url)));
const port = Number(process.argv[2] ?? 4174);
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const path = resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!path.startsWith(`${root}${sep}`)) {
      response.writeHead(403).end();
      return;
    }
    const data = await readFile(path);
    response.writeHead(200, { "content-type": mimeTypes[extname(path)] ?? "application/octet-stream", "x-content-type-options": "nosniff" }).end(data);
  } catch (error) {
    response.writeHead(error.code === "ENOENT" ? 404 : 400).end();
  }
}).listen(port, "127.0.0.1", () => {
  process.stdout.write(`Serving ${root} at http://127.0.0.1:${port}/\n`);
});
