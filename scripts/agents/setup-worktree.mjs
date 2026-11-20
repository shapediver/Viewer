// Tool-neutral worktree setup. Idempotent and fast on repeat runs, so every tool can run it on session start.
//   node scripts/agents/setup-worktree.mjs [--no-copy] [--no-install] [--no-build]
// 1. Copy local, gitignored files listed in .worktreeinclude from the main checkout (skips existing files).
//    Same semantics as Claude Code's .worktreeinclude: gitignore syntax, only files that are also gitignored.
// 2. Run `pnpm install` when node_modules is missing.
// 3. Run the root `pnpm build` when a library package has no dist/: packages type-check against their
//    workspace dependencies' dist/, so a fresh worktree can't typecheck without it. Stops before the
//    hook timeout; tsc -b is incremental, so the next run continues where this one stopped.
// Called by: .claude/settings.json and .codex/hooks.json (SessionStart), .cursor/hooks.json (sessionStart,
// workspaceOpen), .cursor/worktrees.json (setup-worktree). Prints hook output when stdin carries a hook event.
import {spawn, spawnSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const HOOK_TIMEOUT_MS = 600000;
const STARTED = Date.now();
// Library package groups whose dist/ other packages and examples consume (examples and tests are not built).
const LIBRARY_DIRS = [
	"shared",
	"data-engine",
	"session-engine",
	"rendering-engine",
	"features",
	"api",
	"creation-control-center",
];
const SKIP_DIRS = [
	"node_modules",
	".git",
	".claude/worktrees",
	"dist",
	"dist-dev",
	"dist-prod",
	"test-results",
];
const SESSION_CONTEXT = [
	"Viewer worktree setup ran (scripts/agents/setup-worktree.mjs): it copies local files, installs dependencies and builds packages to dist/ (see warnings below if a step failed).",
	"- If a package's `pnpm check` reports missing workspace types, build its dependencies: `npx lerna run build --scope <package name> --include-dependencies`.",
].join("\n");

const log = [];

function git(cwd, args, input) {
	const r = spawnSync("git", args, {
		cwd,
		input,
		encoding: "utf8",
		windowsHide: true,
		timeout: 170000,
	});
	return r.status === 0 ? r.stdout.trim() : null;
}

// Hooks pipe their event and close stdin at once. A shell that leaves stdin open (an agent running the
// script by hand) would block a synchronous read forever, so stop waiting after 2 s.
function readStdin() {
	if (process.stdin.isTTY) return Promise.resolve({});
	return new Promise((resolve) => {
		let raw = "";
		const done = () => {
			clearTimeout(timer);
			process.stdin.pause();
			try {
				resolve(raw.trim() ? JSON.parse(raw) : {});
			} catch {
				resolve({});
			}
		};
		const timer = setTimeout(done, 2000);
		process.stdin.setEncoding("utf8");
		process.stdin.on("data", (chunk) => (raw += chunk));
		process.stdin.on("end", done);
		process.stdin.on("error", done);
	});
}

// .worktreeinclude line -> glob relative to the repo root (gitignore semantics, simplified)
function toGlob(pattern) {
	let p = pattern.replace(/\\/g, "/");
	const dir = p.endsWith("/");
	p = p.replace(/\/+$/, "");
	const anchored = p.startsWith("/") || p.includes("/");
	p = p.replace(/^\/+/, "");
	if (!anchored && !p.startsWith("**/")) p = `{${p},**/${p}}`;
	return dir ? `${p}/**` : p;
}

function copyIncluded(root, main) {
	const listFile = path.join(root, ".worktreeinclude");
	if (!fs.existsSync(listFile)) return;
	const lines = fs
		.readFileSync(listFile, "utf8")
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter((l) => l && !l.startsWith("#"));
	const exclude = (f) =>
		SKIP_DIRS.some(
			(d) => f === d || f.startsWith(`${d}/`) || f.includes(`/${d}/`),
		);
	const opts = {
		cwd: main,
		exclude: (f) => exclude(String(f).replace(/\\/g, "/")),
	};
	const files = new Set();
	for (const line of lines) {
		const negate = line.startsWith("!");
		for (const f of fs.globSync(
			toGlob(negate ? line.slice(1) : line),
			opts,
		)) {
			const rel = f.replace(/\\/g, "/");
			if (!fs.statSync(path.join(main, rel)).isFile()) continue;
			negate ? files.delete(rel) : files.add(rel);
		}
	}
	if (!files.size) return;
	// Only gitignored files, so tracked files are never overwritten.
	const ignored = new Set(
		(git(main, ["check-ignore", "--stdin"], [...files].join("\n")) ?? "")
			.split(/\r?\n/)
			.filter(Boolean),
	);
	for (const rel of files) {
		if (!ignored.has(rel)) continue;
		const dest = path.join(root, rel);
		if (fs.existsSync(dest)) continue;
		fs.mkdirSync(path.dirname(dest), {recursive: true});
		fs.copyFileSync(path.join(main, rel), dest);
		log.push(`copied ${rel}`);
	}
}

// Runs one shell command (pnpm is a .cmd shim on Windows and needs a shell). On timeout, kills the whole
// process tree so no orphaned build keeps running into the next session.
// Package builds run `bash ../../scripts/building/build.sh`. Started outside Git Bash (Cursor from
// PowerShell), `bash` on Windows resolves to WSL's bash.exe, which fails without a distro. Put Git's
// bin folder first so `bash` is Git Bash.
function childEnv(root) {
	const env = {...process.env};
	if (process.platform !== "win32") return env;
	const exec = git(root, ["--exec-path"]);
	if (!exec) return env;
	const bin = path.resolve(exec, "..", "..", "..", "bin");
	if (!fs.existsSync(path.join(bin, "bash.exe"))) return env;
	const key = Object.keys(env).find((k) => k.toUpperCase() === "PATH");
	env[key ?? "PATH"] = `${bin}${path.delimiter}${env[key] ?? ""}`;
	return env;
}

function run(command, cwd, timeoutMs) {
	return new Promise((resolve) => {
		const child = spawn(command, {
			cwd,
			env: childEnv(cwd),
			stdio: "ignore",
			shell: true,
			windowsHide: true,
			detached: process.platform !== "win32",
		});
		let timedOut = false;
		const timer = setTimeout(() => {
			timedOut = true;
			if (process.platform === "win32") {
				spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
					windowsHide: true,
				});
			} else {
				try {
					process.kill(-child.pid, "SIGKILL");
				} catch {}
			}
		}, timeoutMs);
		child.on("error", () => {
			clearTimeout(timer);
			resolve({status: -1, timedOut});
		});
		child.on("exit", (status) => {
			clearTimeout(timer);
			resolve({status, timedOut});
		});
	});
}

const remaining = () => HOOK_TIMEOUT_MS - 30000 - (Date.now() - STARTED);

// pnpm writes .modules.yaml at the end of an install, so a killed or failed install is retried.
const installed = (root) =>
	fs.existsSync(path.join(root, "node_modules", ".modules.yaml"));

// One run at a time: Cursor fires workspaceOpen, sessionStart and setup-worktree together on a new
// worktree. The lock lives in the worktree's git dir; a lock older than the hook timeout is stale.
function takeLock(gitDir) {
	const file = path.join(gitDir, "agent-setup.lock");
	try {
		if (Date.now() - fs.statSync(file).mtimeMs > HOOK_TIMEOUT_MS)
			fs.rmSync(file, {force: true});
	} catch {}
	try {
		fs.closeSync(fs.openSync(file, "wx"));
	} catch {
		return null;
	}
	return () => fs.rmSync(file, {force: true});
}

// Without node_modules, prettier/eslint/tsc can't run. pnpm links from its global store, so a fresh
// install is fast; later runs skip this step.
async function installDeps(root) {
	if (installed(root)) return;
	const r = await run(
		"pnpm install --frozen-lockfile --prefer-offline",
		root,
		remaining(),
	);
	log.push(
		r.status === 0
			? "installed dependencies (pnpm install)"
			: `warning: pnpm install ${r.timedOut ? "timed out" : `failed (exit ${r.status})`}; run it by hand`,
	);
}

function unbuiltPackages(root) {
	const missing = [];
	for (const group of LIBRARY_DIRS) {
		const dir = path.join(root, group);
		if (!fs.existsSync(dir)) continue;
		for (const name of fs.readdirSync(dir)) {
			const pkg = path.join(dir, name);
			try {
				const json = JSON.parse(
					fs.readFileSync(path.join(pkg, "package.json"), "utf8"),
				);
				// tsc -b writes tsconfig.tsbuildinfo last, so a build cut off mid-package still counts as missing.
				if (
					json.scripts?.build &&
					!fs.existsSync(path.join(pkg, "tsconfig.tsbuildinfo"))
				)
					missing.push(`${group}/${name}`);
			} catch {}
		}
	}
	return missing;
}

async function buildPackages(root) {
	if (!installed(root)) return;
	const missing = unbuiltPackages(root);
	if (!missing.length) return;
	const budget = remaining();
	if (budget < 60000) {
		log.push(
			`warning: ${missing.length} packages have no dist/ and no time is left; run \`pnpm build\` at the root`,
		);
		return;
	}
	const r = await run("pnpm build", root, budget);
	const left = unbuiltPackages(root);
	log.push(
		r.status === 0 && !left.length
			? `built ${missing.length} packages (pnpm build)`
			: `warning: pnpm build ${r.timedOut ? "stopped at the hook timeout" : `failed (exit ${r.status})`}; ${left.length} packages still have no dist/. The next session start continues, or run \`pnpm build\` at the root`,
	);
}

const input = await readStdin();
const start =
	process.env.CLAUDE_PROJECT_DIR ||
	process.env.CURSOR_PROJECT_DIR ||
	input.cwd ||
	process.cwd();
const root = git(start, ["rev-parse", "--show-toplevel"]) ?? start;
const commonDir = git(root, [
	"rev-parse",
	"--path-format=absolute",
	"--git-common-dir",
]);
const main = commonDir ? path.dirname(commonDir) : root;
const gitDir = git(root, ["rev-parse", "--path-format=absolute", "--git-dir"]);
let release = null;

for (const step of [
	() =>
		!process.argv.includes("--no-copy") &&
		path.resolve(main) !== path.resolve(root) &&
		copyIncluded(root, main),
	() => {
		if (!gitDir) return;
		release = takeLock(gitDir);
		if (!release)
			log.push(
				"warning: another setup run is installing or building; it finishes in the background",
			);
	},
	() =>
		release && !process.argv.includes("--no-install") && installDeps(root),
	() =>
		release && !process.argv.includes("--no-build") && buildPackages(root),
]) {
	try {
		await step();
	} catch (e) {
		log.push(`warning: ${e.message}`); // fail open: session start must not block
	}
}
release?.();

const event = input.hook_event_name;
const context = log.some((l) => l.startsWith("warning"))
	? `${SESSION_CONTEXT}\n- Setup warnings: ${log.filter((l) => l.startsWith("warning")).join("; ")}`
	: SESSION_CONTEXT;
if (event === "sessionStart") {
	process.stdout.write(JSON.stringify({additional_context: context})); // Cursor
} else if (event === "SessionStart") {
	process.stdout.write(
		JSON.stringify({
			hookSpecificOutput: {
				hookEventName: "SessionStart",
				additionalContext: context,
			},
		}),
	); // Claude Code, Codex
} else if (event) {
	process.stdout.write("{}");
} else {
	console.log(log.length ? log.join("\n") : "worktree already set up");
}
