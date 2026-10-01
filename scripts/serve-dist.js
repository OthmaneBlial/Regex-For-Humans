import { readFile, realpath, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = await realpath(
  resolve(process.argv[3] ?? fileURLToPath(new URL("../dist/", import.meta.url))),
);
const port = Number(process.argv[2] ?? 4174);
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    const pathname = decodeURIComponent(url.pathname);
    const path = resolve(root, `.${pathname.endsWith("/") ? `${pathname}index.html` : pathname}`);
    if (!path.startsWith(`${root}${sep}`)) {
      response.writeHead(403).end();
      return;
    }
    const target = await realpath(path);
    if (target !== root && !target.startsWith(`${root}${sep}`)) {
      response.writeHead(403).end();
      return;
    }
    if (!pathname.endsWith("/") && (await stat(target)).isDirectory()) {
      response.writeHead(308, { location: `${url.pathname}/${url.search}` }).end();
      return;
    }
    const data = await readFile(target);
    response
      .writeHead(200, {
        "content-type": mimeTypes[extname(path).toLowerCase()] ?? "application/octet-stream",
        "x-content-type-options": "nosniff",
      })
      .end(data);
  } catch (error) {
    response.writeHead(["ENOENT", "ENOTDIR"].includes(error.code) ? 404 : 400).end();
  }
}).listen(port, "127.0.0.1", () => {
  process.stdout.write(`Serving ${root} at http://127.0.0.1:${server.address().port}/\n`);
});
