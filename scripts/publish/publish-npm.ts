/**
 * publish-npm.ts
 *
 * Publishes packages to the npm registry with the latest dist-tag.
 * Restores the GitHub Packages registry after publishing.
 *
 * Usage:
 *   npx ts-node -T scripts/publish/publish-npm.ts
 *   npx ts-node -T scripts/publish/publish-npm.ts --yes
 *   npx ts-node -T scripts/publish/publish-npm.ts --dry-run
 *
 * Options:
 *   --yes      skip confirmation prompt
 *   --dry-run  show what would be published without actually publishing
 *
 * Auth:
 *   Intended to run under npm Trusted Publishing in GitHub Actions (OIDC).
 *   Local manual publish can still use your existing npm auth setup.
 *   Registry is switched in user config during publish, then restored to GitHub Packages.
 */

import {execSync} from "child_process";

interface PublishArgs {
	silent: boolean;
	dryRun: boolean;
}

function parseArgs(): PublishArgs {
	const args = process.argv.slice(2);
	const result: PublishArgs = {silent: false, dryRun: false};

	for (let i = 0; i < args.length; i++) {
		if (args[i] === "--yes") result.silent = true;
		else if (args[i] === "--dry-run") result.dryRun = true;
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
	const {silent, dryRun} = parseArgs();

	if (!silent) {
		console.log(`\n=== Publish to npm ===`);
		if (dryRun) console.log(`  Mode: dry-run`);
		console.log("");
	}

	if (dryRun) {
		const raw = run("npx lerna list --all --json --loglevel=error 2>&1");
		const packages = JSON.parse(raw);
		const publishable = packages.filter((p: any) => !p.private);

		if (!silent) {
			console.log(
				`Would publish ${publishable.length} packages to npm with tag "latest":`,
			);
			for (const p of publishable) {
				console.log(`  ${p.name}@${p.version}`);
			}
		}
		console.log(JSON.stringify({packageCount: publishable.length, dryRun: true}));
		return;
	}

	if (!silent) {
		console.log("This will publish packages to the npm registry.");
		console.log("Proceed? (y/N) ");
		const input = require("fs").readFileSync(0, "utf8").trim().toLowerCase();
		if (input !== "y" && input !== "yes") {
			console.log("Aborted.");
			process.exit(1);
		}
	}

	// Switch to npm registry without mutating tracked project files
	run("pnpm config set @shapediver:registry https://registry.npmjs.org/ --location=user");

	// Publish with provenance for npm Trusted Publishing (OIDC)
	const output = run(
		"npx lerna publish from-package --yes --no-private --dist-tag latest --provenance",
	);

	if (!silent) console.log(output);

	// Restore GitHub Packages registry in user config
	run("pnpm config set @shapediver:registry https://npm.pkg.github.com --location=user");

	console.log(JSON.stringify({published: true}));
}

main();