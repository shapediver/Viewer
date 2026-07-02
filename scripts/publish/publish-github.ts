/**
 * publish-github.ts
 *
 * Publishes packages to GitHub Packages with a given dist-tag.
 *
 * Usage:
 *   npx ts-node -T scripts/publish/publish-github.ts --tag dev
 *   npx ts-node -T scripts/publish/publish-github.ts --tag next
 *   npx ts-node -T scripts/publish/publish-github.ts --tag latest
 *   npx ts-node -T scripts/publish/publish-github.ts --tag dev --yes
 *   npx ts-node -T scripts/publish/publish-github.ts --tag dev --dry-run
 *
 * Options:
 *   --tag      dev | next | latest  (required — npm dist-tag)
 *   --yes      skip confirmation prompt
 *   --dry-run  show what would be published without actually publishing
 *
 * Auth:
 *   CI: uses GITHUB_TOKEN or NODE_AUTH_TOKEN env var
 *   Local: uses ~/.npmrc or .npmrc GitHub token
 */

import {execSync} from "child_process";

interface PublishArgs {
	tag: string;
	silent: boolean;
	dryRun: boolean;
}

function parseArgs(): PublishArgs {
	const args = process.argv.slice(2);
	const result: PublishArgs = {tag: "", silent: false, dryRun: false};

	for (let i = 0; i < args.length; i++) {
		if (args[i] === "--tag" && args[i + 1]) result.tag = args[++i];
		else if (args[i] === "--yes") result.silent = true;
		else if (args[i] === "--dry-run") result.dryRun = true;
	}

	if (!["dev", "next", "latest"].includes(result.tag)) {
		throw new Error("--tag must be dev, next, or latest");
	}

	return result;
}

function run(cmd: string): string {
	try {
		return execSync(cmd, {encoding: "utf8", stdio: "pipe"}).trim();
	} catch (e: any) {
		throw new Error(`Command failed: ${cmd}\n${e.stderr || e.message}`);
	}
}

function main() {
	const {tag, silent, dryRun} = parseArgs();

	if (!silent) {
		console.log(`\n=== Publish to GitHub Packages ===`);
		console.log(`  Tag: ${tag}`);
		if (dryRun) console.log(`  Mode: dry-run`);
		console.log("");
	}

	if (dryRun) {
		// Use --loglevel=error to suppress notices that pollute JSON output
		const raw = run("npx lerna list --all --json --loglevel=error 2>&1");
		const packages = JSON.parse(raw);
		const publishable = packages.filter((p: any) => !p.private);

		if (!silent) {
			console.log(
				`Would publish ${publishable.length} packages to GitHub Packages with tag "${tag}":`,
			);
			for (const p of publishable) {
				console.log(`  ${p.name}@${p.version}`);
			}
		}
		console.log(JSON.stringify({tag, packageCount: publishable.length, dryRun: true}));
		return;
	}

	if (!silent) {
		console.log("This will publish packages to GitHub Packages.");
		console.log("Proceed? (y/N) ");
		const input = require("fs").readFileSync(0, "utf8").trim().toLowerCase();
		if (input !== "y" && input !== "yes") {
			console.log("Aborted.");
			process.exit(1);
		}
	}

	// Set registry to GitHub Packages
	run("pnpm config set @shapediver:registry https://npm.pkg.github.com --location=project");

	// Publish
	const output = run(
		`npx lerna publish from-package --yes --no-private --dist-tag ${tag}`,
	);

	if (!silent) console.log(output);
	console.log(JSON.stringify({tag, published: true}));
}

main();