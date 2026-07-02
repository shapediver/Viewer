/**
 * compute-version.ts
 *
 * Computes the next version for a given release channel.
 *
 * Usage:
 *   npx ts-node -T scripts/release/compute-version.ts --channel dev
 *   npx ts-node -T scripts/release/compute-version.ts --channel next
 *   npx ts-node -T scripts/release/compute-version.ts --channel release --release-type patch
 *   npx ts-node -T scripts/release/compute-version.ts --channel release --release-type minor --yes
 *
 * Output (stdout): JSON  { "version": "x.y.z" }
 * With --yes: silent JSON (no extra log output)
 */

import * as fs from "fs";
import * as path from "path";

const PACKAGE_PATH = path.resolve(
	__dirname,
	"../../api/default/package.json",
);

interface VersionResult {
	version: string;
}

function parseArgs(): {channel: string; releaseType?: string; silent: boolean} {
	const args = process.argv.slice(2);
	const result: {channel: string; releaseType?: string; silent: boolean} = {
		channel: "",
		silent: false,
	};

	for (let i = 0; i < args.length; i++) {
		if (args[i] === "--channel" && args[i + 1]) {
			result.channel = args[++i];
		} else if (args[i] === "--release-type" && args[i + 1]) {
			result.releaseType = args[++i];
		} else if (args[i] === "--yes") {
			result.silent = true;
		}
	}

	if (!["dev", "next", "release"].includes(result.channel)) {
		throw new Error(
			`Invalid channel: "${result.channel}". Must be dev, next, or release.`,
		);
	}

	if (result.channel === "release" && !result.releaseType) {
		throw new Error(
			'--release-type is required for channel "release" (patch|minor|major)',
		);
	}

	if (
		result.releaseType &&
		!["patch", "minor", "major"].includes(result.releaseType)
	) {
		throw new Error(
			`Invalid release type: "${result.releaseType}". Must be patch, minor, or major.`,
		);
	}

	return result;
}

function readCurrentVersion(): string {
	try {
		const pkg = JSON.parse(fs.readFileSync(PACKAGE_PATH, "utf8"));
		if (!pkg.version) throw new Error("No version field in package.json");
		return pkg.version;
	} catch (e: any) {
		throw new Error(
			`Failed to read version from ${PACKAGE_PATH}: ${e.message}`,
		);
	}
}

/**
 * Parse a semver string into components.
 * "3.19.0"           → { major: 3, minor: 19, patch: 0, prerelease: null }
 * "3.19.0-dev.3"     → { major: 3, minor: 19, patch: 0, prerelease: "dev", counter: 3 }
 * "3.19.0-next.1"    → { major: 3, minor: 19, patch: 0, prerelease: "next", counter: 1 }
 */
function parseVersion(
	version: string,
): {major: number; minor: number; patch: number; prerelease: string | null; counter: number} {
	// Split off prerelease suffix if present
	const dashIndex = version.indexOf("-");
	let base: string;
	let prerelease: string | null = null;
	let counter = 0;

	if (dashIndex >= 0) {
		base = version.substring(0, dashIndex);
		const suffix = version.substring(dashIndex + 1);
		// suffix could be "dev.3" or "next.1" or "rc.0"
		const parts = suffix.split(".");
		prerelease = parts[0];
		if (parts.length > 1) {
			counter = parseInt(parts[1], 10) || 0;
		}
	} else {
		base = version;
	}

	const parts = base.split(".").map(Number);
	if (parts.length < 3 || parts.some(isNaN)) {
		throw new Error(`Invalid version format: "${version}"`);
	}

	return {
		major: parts[0],
		minor: parts[1],
		patch: parts[2],
		prerelease,
		counter,
	};
}

function computeVersion(current: string, channel: string, releaseType?: string): string {
	const parsed = parseVersion(current);

	if (channel === "release") {
		// Always bump from the base version (strip prerelease first)
		let major = parsed.major;
		let minor = parsed.minor;
		let patch = parsed.patch;

		switch (releaseType) {
			case "major":
				major++;
				minor = 0;
				patch = 0;
				break;
			case "minor":
				minor++;
				patch = 0;
				break;
			case "patch":
				patch++;
				break;
		}

		return `${major}.${minor}.${patch}`;
	}

	// dev or next channel
	const suffix = channel; // "dev" or "next"
	const isSamePrerelease = parsed.prerelease === suffix;

	if (isSamePrerelease) {
		// Same suffix: increment counter
		return `${parsed.major}.${parsed.minor}.${parsed.patch}-${suffix}.${parsed.counter + 1}`;
	}

	// Different suffix (or no prerelease): start at .1
	return `${parsed.major}.${parsed.minor}.${parsed.patch}-${suffix}.1`;
}

function main() {
	const {channel, releaseType, silent} = parseArgs();
	const current = readCurrentVersion();
	const next = computeVersion(current, channel, releaseType);
	const result: VersionResult = {version: next};

	if (!silent) {
		console.log(`Current: ${current}`);
		console.log(`Channel: ${channel}`);
		if (releaseType) console.log(`Type:    ${releaseType}`);
		console.log(`Next:    ${next}`);
	}

	// Always output JSON on stdout (for CI consumption)
	console.log(JSON.stringify(result));
}

main();