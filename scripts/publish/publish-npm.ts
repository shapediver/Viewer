/**
 * publish-npm.ts
 *
 * Publishes Viewer packages to the npm registry with the latest dist-tag.
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

import {execFileSync, execSync} from "child_process";
import * as fs from "fs";
import * as path from "path";

const NPM_REGISTRY = "https://registry.npmjs.org/";
const GITHUB_PACKAGES_REGISTRY = "https://npm.pkg.github.com";

// Release-managed Viewer packages. Deliberately excludes private examples/tests
// and independently-published utils packages.
const PACKAGE_ROOTS = [
	"api",
	"creation-control-center",
	"data-engine",
	"features",
	"rendering-engine",
	"session-engine",
	"shared",
];

interface PublishArgs {
	silent: boolean;
	dryRun: boolean;
}

interface PublishablePackage {
	name: string;
	version: string;
	dir: string;
	dependencies: string[];
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

function runFile(command: string, args: string[], cwd?: string): string {
	try {
		return execFileSync(command, args, {
			cwd,
			encoding: "utf8",
			stdio: "pipe",
			env: process.env,
		}).trim();
	} catch (e: any) {
		const rendered = [command, ...args].join(" ");
		const stderr = e.stderr?.toString?.() || e.message;
		throw new Error(`Command failed: ${rendered}\n${stderr}`);
	}
}

function readPackageJson(packagePath: string): any {
	return JSON.parse(fs.readFileSync(packagePath, "utf8"));
}

function collectDependencyNames(pkg: any): string[] {
	const dependencyBlocks = [
		pkg.dependencies,
		pkg.peerDependencies,
		pkg.optionalDependencies,
	];
	return dependencyBlocks.flatMap((deps) => (deps ? Object.keys(deps) : []));
}

function discoverPackages(): PublishablePackage[] {
	const packages: PublishablePackage[] = [];

	function walk(dir: string) {
		if (!fs.existsSync(dir)) return;

		for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
			if (entry.name === "node_modules" || entry.name === "dist") continue;

			const entryPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				walk(entryPath);
				continue;
			}

			if (entry.name !== "package.json") continue;

			const pkg = readPackageJson(entryPath);
			if (!pkg.name || pkg.private) continue;
			if (!pkg.name.startsWith("@shapediver/viewer")) continue;

			packages.push({
				name: pkg.name,
				version: pkg.version,
				dir: path.dirname(entryPath),
				dependencies: collectDependencyNames(pkg),
			});
		}
	}

	for (const root of PACKAGE_ROOTS) walk(root);

	return sortPackagesByLocalDependencies(packages);
}

function sortPackagesByLocalDependencies(packages: PublishablePackage[]): PublishablePackage[] {
	const byName = new Map(packages.map((pkg) => [pkg.name, pkg]));
	const visited = new Set<string>();
	const visiting = new Set<string>();
	const result: PublishablePackage[] = [];

	function visit(pkg: PublishablePackage) {
		if (visited.has(pkg.name)) return;
		if (visiting.has(pkg.name)) return;

		visiting.add(pkg.name);
		for (const dependency of pkg.dependencies) {
			const localDependency = byName.get(dependency);
			if (localDependency) visit(localDependency);
		}
		visiting.delete(pkg.name);
		visited.add(pkg.name);
		result.push(pkg);
	}

	for (const pkg of packages.sort((a, b) => a.name.localeCompare(b.name))) {
		visit(pkg);
	}

	return result;
}

function isAlreadyPublished(pkg: PublishablePackage): boolean {
	try {
		const publishedVersion = runFile("npm", [
			"view",
			`${pkg.name}@${pkg.version}`,
			"version",
			"--registry",
			NPM_REGISTRY,
		]);
		return publishedVersion === pkg.version;
	} catch {
		return false;
	}
}

function publishPackage(pkg: PublishablePackage): string {
	return runFile("npm", [
		"publish",
		pkg.dir,
		"--access",
		"public",
		"--tag",
		"latest",
		"--registry",
		NPM_REGISTRY,
	]);
}

function main() {
	const {silent, dryRun} = parseArgs();
	const packages = discoverPackages();

	if (!silent) {
		console.log(`\n=== Publish to npm ===`);
		if (dryRun) console.log(`  Mode: dry-run`);
		console.log(`  Packages: ${packages.length}`);
		console.log("");
	}

	if (dryRun) {
		if (!silent) {
			console.log(`Would publish ${packages.length} packages to npm with tag "latest":`);
			for (const pkg of packages) console.log(`  ${pkg.name}@${pkg.version} (${pkg.dir})`);
		}
		console.log(JSON.stringify({packageCount: packages.length, dryRun: true}));
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

	// Switch to npm registry without mutating tracked project files.
	run("pnpm config set @shapediver:registry https://registry.npmjs.org/ --location=user");

	const published: string[] = [];
	const skipped: string[] = [];

	try {
		for (const pkg of packages) {
			if (isAlreadyPublished(pkg)) {
				if (!silent) console.log(`Skipping already published ${pkg.name}@${pkg.version}`);
				skipped.push(`${pkg.name}@${pkg.version}`);
				continue;
			}

			if (!silent) console.log(`Publishing ${pkg.name}@${pkg.version}`);
			const output = publishPackage(pkg);
			if (!silent && output) console.log(output);
			published.push(`${pkg.name}@${pkg.version}`);
		}
	} finally {
		// Restore GitHub Packages registry in user config.
		run("pnpm config set @shapediver:registry https://npm.pkg.github.com --location=user");
	}

	console.log(JSON.stringify({published, skipped, packageCount: packages.length}));
}

main();
