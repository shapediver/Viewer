/**
 * publish-npm.ts
 *
 * Publishes Viewer packages to the npm registry with the latest dist-tag.
 * Publishes from temporary package directories so workspace dependencies can be
 * rewritten without mutating repository package.json files.
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
 *   npm Trusted Publishing (OIDC) in GitHub Actions. The workflow grants
 *   id-token: write and setup-node with registry-url, so npm CLI exchanges
 *   the GitHub OIDC token automatically. No NPM_TOKEN needed.
 *
 * Registry:
 *   The workflow .npmrc and explicit --registry / --@shapediver:registry args
 *   own registry selection. This script does not mutate user-level config.
 *
 * Workspace deps:
 *   Published packages rewrite workspace:* to exact versions, consistent
 *   with this repo's --exact (pinned) release versioning.
 */

import {execFileSync} from "child_process";
import * as fs from "fs";
import * as path from "path";

const NPM_REGISTRY = "https://registry.npmjs.org/";
const NPM_BIN = process.platform === "win32" ? "npm.cmd" : "npm";
const PUBLISH_TEMP_ROOT = ".tmp-npm-publish";
const NPM_COMMAND_TIMEOUT_MS = 180_000;
const NPM_COMMAND_MAX_BUFFER = 100 * 1024 * 1024;
const DEPENDENCY_BLOCKS = [
	"dependencies",
	"peerDependencies",
	"optionalDependencies",
	"devDependencies",
];

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

interface PackInfo {
	filename: string;
	files: {path: string}[];
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

function runFile(command: string, args: string[], cwd?: string): string {
	try {
		return execFileSync(command, args, {
			cwd,
			encoding: "utf8",
			stdio: "pipe",
			env: process.env,
			shell: process.platform === "win32",
			timeout: NPM_COMMAND_TIMEOUT_MS,
			maxBuffer: NPM_COMMAND_MAX_BUFFER,
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
		const publishedVersion = runFile(NPM_BIN, [
			"view",
			`${pkg.name}@${pkg.version}`,
			"version",
			"--registry",
			NPM_REGISTRY,
			`--@shapediver:registry=${NPM_REGISTRY}`,
		]);
		return publishedVersion === pkg.version;
	} catch {
		return false;
	}
}

function packagePath(pkg: PublishablePackage): string {
	return path.resolve(pkg.dir);
}

function rewriteWorkspaceSpec(spec: string, version: string): string {
	if (!spec.startsWith("workspace:")) return spec;

	const workspaceRange = spec.slice("workspace:".length);
	if (workspaceRange === "^") return `^${version}`;
	if (workspaceRange === "~") return `~${version}`;

	// Release versioning uses exact internal package versions, so workspace:*
	// and explicit workspace ranges are published as the exact release version.
	return version;
}

function rewriteWorkspaceDependencies(pkg: any, localVersions: Map<string, string>): void {
	for (const blockName of DEPENDENCY_BLOCKS) {
		const block = pkg[blockName];
		if (!block) continue;

		for (const [dependencyName, dependencySpec] of Object.entries(block)) {
			if (typeof dependencySpec !== "string") continue;
			const localVersion = localVersions.get(dependencyName);
			if (!localVersion) continue;

			block[dependencyName] = rewriteWorkspaceSpec(dependencySpec, localVersion);
		}
	}
}

function assertNoWorkspaceDependencies(pkg: any, pkgName: string): void {
	for (const blockName of DEPENDENCY_BLOCKS) {
		const block = pkg[blockName];
		if (!block) continue;

		for (const [dependencyName, dependencySpec] of Object.entries(block)) {
			if (typeof dependencySpec === "string" && dependencySpec.startsWith("workspace:")) {
				throw new Error(
					`${pkgName} still contains ${blockName}.${dependencyName}=${dependencySpec} after publish preparation`,
				);
			}
		}
	}
}

function readPackInfo(pkg: PublishablePackage, packOutput: string): PackInfo {
	let parsedPackOutput: unknown;
	try {
		parsedPackOutput = JSON.parse(packOutput);
	} catch (error: any) {
		throw new Error(`npm pack produced invalid JSON for ${pkg.name}: ${error.message}`);
	}

	const packInfo = Array.isArray(parsedPackOutput) ? parsedPackOutput[0] as PackInfo | undefined : undefined;
	if (!packInfo?.filename || !Array.isArray(packInfo.files) || packInfo.files.length === 0) {
		throw new Error(`npm pack produced no publishable files for ${pkg.name}`);
	}

	return packInfo;
}

function preparePublishDirectory(pkg: PublishablePackage, localVersions: Map<string, string>): {publishDir: string; tempRoot: string} {
	const safeName = pkg.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
	const tempRoot = path.resolve(PUBLISH_TEMP_ROOT, `${safeName}-${process.pid}-${Date.now()}`);
	const publishDir = path.join(tempRoot, "package");

	fs.rmSync(tempRoot, {recursive: true, force: true});
	fs.mkdirSync(tempRoot, {recursive: true});

	try {
		const packDestination = path.relative(packagePath(pkg), tempRoot) || ".";
		const packOutput = runFile(NPM_BIN, ["pack", "--json", "--pack-destination", packDestination], packagePath(pkg));
		const packInfo = readPackInfo(pkg, packOutput);

		for (const file of packInfo.files) {
			const sourcePath = path.join(packagePath(pkg), file.path);
			const targetPath = path.join(publishDir, file.path);
			fs.mkdirSync(path.dirname(targetPath), {recursive: true});
			fs.cpSync(sourcePath, targetPath, {recursive: true});
		}

		fs.rmSync(path.join(tempRoot, packInfo.filename), {force: true});

		const publishPackageJsonPath = path.join(publishDir, "package.json");
		const publishPackageJson = readPackageJson(publishPackageJsonPath);
		rewriteWorkspaceDependencies(publishPackageJson, localVersions);
		assertNoWorkspaceDependencies(publishPackageJson, pkg.name);
		fs.writeFileSync(publishPackageJsonPath, `${JSON.stringify(publishPackageJson, null, "\t")}\n`);

		return {publishDir, tempRoot};
	} catch (error) {
		fs.rmSync(tempRoot, {recursive: true, force: true});
		throw error;
	}
}

function withPreparedPackage<T>(pkg: PublishablePackage, localVersions: Map<string, string>, action: (publishDir: string) => T): T {
	const {publishDir, tempRoot} = preparePublishDirectory(pkg, localVersions);
	try {
		return action(publishDir);
	} finally {
		fs.rmSync(tempRoot, {recursive: true, force: true});
	}
}

function dryRunPackage(pkg: PublishablePackage, localVersions: Map<string, string>): string {
	return withPreparedPackage(pkg, localVersions, (publishDir) =>
		runFile(NPM_BIN, [
			"publish",
			"--dry-run",
			"--access",
			"public",
			"--tag",
			"latest",
			"--registry",
			NPM_REGISTRY,
			`--@shapediver:registry=${NPM_REGISTRY}`,
		], publishDir),
	);
}

function publishPackage(pkg: PublishablePackage, localVersions: Map<string, string>): string {
	return withPreparedPackage(pkg, localVersions, (publishDir) =>
		runFile(NPM_BIN, [
			"publish",
			"--access",
			"public",
			"--tag",
			"latest",
			"--registry",
			NPM_REGISTRY,
			`--@shapediver:registry=${NPM_REGISTRY}`,
		], publishDir),
	);
}

function main() {
	const {silent, dryRun} = parseArgs();
	const packages = discoverPackages();
	const localVersions = new Map(packages.map((pkg) => [pkg.name, pkg.version]));

	if (!silent) {
		console.log(`\n=== Publish to npm ===`);
		if (dryRun) console.log(`  Mode: dry-run`);
		console.log(`  Packages: ${packages.length}`);
		console.log("");
	}

	if (dryRun) {
		if (!silent) {
			console.log(`Would publish ${packages.length} packages to npm with tag "latest":`);
		}
		for (const pkg of packages) {
			if (!silent) console.log(`  ${pkg.name}@${pkg.version} (${pkg.dir})`);
			dryRunPackage(pkg, localVersions);
		}
		console.log(JSON.stringify({packageCount: packages.length, dryRun: true}));
		return;
	}

	if (!silent) {
		console.log("This will publish packages to the npm registry.");
		console.log("Proceed? (y/N) ");
		const input = fs.readFileSync(0, "utf8").trim().toLowerCase();
		if (input !== "y" && input !== "yes") {
			console.log("Aborted.");
			process.exit(1);
		}
	}

	const published: string[] = [];
	const skipped: string[] = [];

	for (const pkg of packages) {
		if (isAlreadyPublished(pkg)) {
			if (!silent) console.log(`Skipping already published ${pkg.name}@${pkg.version}`);
			skipped.push(`${pkg.name}@${pkg.version}`);
			continue;
		}

		if (!silent) console.log(`Publishing ${pkg.name}@${pkg.version}`);
		const output = publishPackage(pkg, localVersions);
		if (!silent && output) console.log(output);
		published.push(`${pkg.name}@${pkg.version}`);
	}

	console.log(JSON.stringify({published, skipped, packageCount: packages.length}));
}

main();
