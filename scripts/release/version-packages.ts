/**
 * version-packages.ts
 *
 * Runs lerna version to update all package.json files to the given version.
 *
 * Usage:
 *   npx ts-node -T scripts/release/version-packages.ts --version 3.19.0-dev.1 --channel dev
 *   npx ts-node -T scripts/release/version-packages.ts --version 3.19.0 --channel release
 *
 * Channel behavior:
 *   dev/next  → --no-git-tag-version --no-push (no commit, no tag)
 *   release   → normal (creates commit + tag)
 *
 * Locally: prompts for confirmation.
 * CI: pass --yes to skip prompts.
 */

import {execSync} from "child_process";

function parseArgs(): {version: string; channel: string; silent: boolean} {
	const args = process.argv.slice(2);
	const result: {version: string; channel: string; silent: boolean} = {
		version: "",
		channel: "",
		silent: false,
	};

	for (let i = 0; i < args.length; i++) {
		if (args[i] === "--version" && args[i + 1]) {
			result.version = args[++i];
		} else if (args[i] === "--channel" && args[i + 1]) {
			result.channel = args[++i];
		} else if (args[i] === "--yes") {
			result.silent = true;
		}
	}

	if (!result.version) throw new Error("--version is required");
	if (!["dev", "next", "release"].includes(result.channel)) {
		throw new Error("--channel must be dev, next, or release");
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
	const {version, channel, silent} = parseArgs();

	if (!silent) {
		console.log(`\nAbout to version all packages to: ${version}`);
		console.log(`Channel: ${channel}`);
		console.log("");

		// Show a preview of what would change
		try {
			const preview = execSync(
				`npx lerna version ${version} --yes --no-private --exact --force-publish --no-git-tag-version --no-push --dry-run`,
				{encoding: "utf8", stdio: "pipe"},
			).trim();
			console.log(preview);
		} catch {
			// dry-run might fail if no changes — ignore
		}

		console.log("\nProceed? (y/N) ");
		const input = require("fs").readFileSync(0, "utf8").trim().toLowerCase();
		if (input !== "y" && input !== "yes") {
			console.log("Aborted.");
			process.exit(1);
		}
	}

	// Build the lerna version command
	const isPrerelease = channel === "dev" || channel === "next";
	const noGitTag = isPrerelease ? "--no-git-tag-version --no-push" : "";
	const cmd = `npx lerna version ${version} --yes --no-private --exact --force-publish ${noGitTag}`.trim();

	if (!silent) console.log(`\nRunning: ${cmd}\n`);

	const output = run(cmd);

	if (!silent) {
		console.log(output);
	}

	if (isPrerelease) {
		// For dev/next: the version was updated but NOT committed.
		// The workflow is responsible for committing and pushing these changes.
		if (!silent) {
			console.log(
				"\n[dev/next] Version updated locally. Remember to commit and push the changes.",
			);
		}
	}

	// Output the version for CI consumption
	console.log(JSON.stringify({version, channel, committed: !isPrerelease}));
}

main();