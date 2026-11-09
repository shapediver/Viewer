import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {extname, join, normalize} from "node:path";
import {fileURLToPath} from "node:url";

const root = normalize(
	join(fileURLToPath(new URL(".", import.meta.url)), "../../examples/test-cdn/dist"),
);
const port = 8099;
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
