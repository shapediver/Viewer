/* eslint-disable no-undef */
/**
 * Renders the comparison shots of this example to PNG files.
 *
 *   node capture.mjs [--out captures] [--shots front,quarter,back,top,head,side]
 *                    [--sceneEnv <preset or .hdr url>] [--gemEnv <preset or .hdr url>]
 *                    [--aoMode composite|shading]
 *                    [--late (apply the materials after the first render)]
 *                    [--port 8080] [--width 683] [--height 768] [--skip-build]
 *
 * The script bundles the example (development mode) from the built packages,
 * serves it on a local port and takes one screenshot of the canvas per shot.
 * Rebuild changed packages (`npm run build` in the package) before running it.
 * The model's ticket only allows localhost on ports 3000, 3001, 5173 and 8080.
 */
import {chromium} from "@playwright/test";
import {execSync} from "node:child_process";
import {cpSync, existsSync, mkdirSync, readFileSync, rmSync} from "node:fs";
import {createServer} from "node:http";
import {dirname, extname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const option = (name, fallback) => {
	const index = args.indexOf(`--${name}`);
	return index === -1 ? fallback : args[index + 1];
};
const out = resolve(root, option("out", "captures"));
const shots = option("shots", "front,quarter,back,top,head,side").split(",");
const port = Number(option("port", "8080"));
const width = Number(option("width", "683"));
const height = Number(option("height", "768"));
const dist = join(root, "dist-dev");

if (!args.includes("--skip-build")) {
	rmSync(dist, {recursive: true, force: true});
	mkdirSync(dist);
	cpSync(join(root, "index.html"), join(dist, "index.html"));
	execSync(
		"pnpm exec webpack --config ../scripts/webpack.dev.js --output-filename bundle.js --output-path dist-dev",
		{cwd: root, stdio: "inherit"},
	);
}

const contentTypes = {
	".html": "text/html",
	".js": "text/javascript",
	".map": "application/json",
};
const server = createServer((request, response) => {
	const path = new URL(request.url, "http://localhost").pathname;
	const file = join(dist, path === "/" ? "index.html" : path);
	if (!file.startsWith(dist) || !existsSync(file)) {
		response.writeHead(404).end();
		return;
	}
	response.writeHead(200, {
		"content-type":
			contentTypes[extname(file)] ?? "application/octet-stream",
	});
	response.end(readFileSync(file));
});
await new Promise((done, fail) => {
	server.once("error", fail);
	server.listen(port, "127.0.0.1", done);
});

mkdirSync(out, {recursive: true});
const browser = await chromium.launch({
	// a real GPU: the viewer disables shadows on the software renderer
	args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"],
});
try {
	const page = await browser.newPage({viewport: {width, height}});
	page.on("pageerror", (error) =>
		console.error("page error:", error.message),
	);
	page.on("console", (message) => {
		if (message.type() === "error")
			console.error("console error:", message.text());
	});
	for (const shot of shots) {
		const url = new URL(`http://localhost:${port}/`);
		url.searchParams.set("shot", shot);
		for (const name of ["sceneEnv", "gemEnv", "aoMode"]) {
			const value = option(name);
			if (value) url.searchParams.set(name, value);
		}
		if (args.includes("--late")) url.searchParams.set("late", "1");
		// the first load after a build can time out, so it is tried twice
		for (let attempt = 0; ; attempt++) {
			try {
				await page.goto(url.href);
				await page.waitForFunction(
					"window.exampleReady === true",
					null,
					{timeout: 60000},
				);
				break;
			} catch (error) {
				if (attempt === 1) throw error;
			}
		}
		// environment maps, the gem normal maps and the soft shadow fade
		await page.waitForTimeout(6000);
		const file = join(out, `${shot}.png`);
		await page.locator("#canvas").screenshot({path: file});
		console.log("saved", file);
	}
} finally {
	await browser.close();
	server.close();
}
