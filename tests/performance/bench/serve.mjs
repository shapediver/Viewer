import {readFile} from "node:fs/promises";
import {createServer} from "node:http";
import {extname, join, normalize, resolve} from "node:path";

// node serve.mjs <directory> <port>
const root = normalize(resolve(process.argv[2]));
const port = Number(process.argv[3]);
const types = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".map": "application/json",
	".wasm": "application/wasm",
};

createServer(async (request, response) => {
	try {
		const url = new URL(request.url ?? "/", "http://127.0.0.1");
		let pathname = decodeURIComponent(url.pathname);
		if (pathname.endsWith("/")) pathname += "index.html";
		const file = normalize(join(root, pathname));
		if (!file.startsWith(root)) {
			response.writeHead(403);
			response.end();
			return;
		}
		const body = await readFile(file);
		response.writeHead(200, {
			"content-type": types[extname(file)] ?? "application/octet-stream",
		});
		response.end(body);
	} catch {
		response.writeHead(404);
		response.end();
	}
}).listen(port, "127.0.0.1");
