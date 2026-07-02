/**
 * generate-build-data.ts
 *
 * Generates shared/build-data/src/build_data.ts from git metadata or env vars.
 *
 * In CI: reads BUILD_VERSION, BUILD_DATE, GITHUB_SHA, GITHUB_REF_NAME env vars.
 * Locally: reads git state and current package.json version.
 *
 * The file is gitignored and regenerated on every build — never stale.
 *
 * Usage:
 *   npx ts-node -T scripts/release/generate-build-data.ts
 *   BUILD_VERSION=3.20.0 npx ts-node -T scripts/release/generate-build-data.ts
 */

import * as fs from "fs";
import * as path from "path";
import {execSync} from "child_process";

const BUILD_DATA_PATH = path.resolve(
	__dirname,
	"../../shared/build-data/src/build_data.ts",
);

function exec(cmd: string): string {
	try {
		return execSync(cmd, {encoding: "utf8"}).trim();
	} catch {
		return "unknown";
	}
}

function generateBuildData() {
	// ---- version ----
	// In CI: BUILD_VERSION env var (set by the workflow after compute-version)
	// Locally: read from the build-data package.json
	const version =
		process.env.BUILD_VERSION ||
		readPackageJsonVersion();

	// ---- build date ----
	const buildDate = process.env.BUILD_DATE || new Date().toISOString();

	// ---- git commit ----
	const buildCommit =
		process.env.GITHUB_SHA || exec("git rev-parse HEAD");

	// ---- git branch ----
	const buildBranch =
		process.env.GITHUB_REF_NAME || exec("git branch --show-current");

	// ---- write file ----
	const content = `export const build_data = ${JSON.stringify(
		{
			build_version: version,
			build_date: buildDate,
			build_branch: buildBranch,
			build_commit: buildCommit,
		},
		null,
		0,
	)};\n`;

	// Ensure directory exists
	fs.mkdirSync(path.dirname(BUILD_DATA_PATH), {recursive: true});
	fs.writeFileSync(BUILD_DATA_PATH, content, "utf8");

	console.log(`[generate-build-data] wrote ${BUILD_DATA_PATH}`);
	console.log(`  version: ${version}`);
	console.log(`  date:    ${buildDate}`);
	console.log(`  branch:  ${buildBranch}`);
	console.log(`  commit:  ${buildCommit}`);
}

function readPackageJsonVersion(): string {
	const pkgPath = path.resolve(
		__dirname,
		"../../shared/build-data/package.json",
	);
	try {
		const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
		if (pkg.version) return pkg.version;
	} catch {
		// fall through
	}
	return "0.0.0";
}

// Only run when executed directly (not imported)
if (require.main === module) {
	generateBuildData();
}