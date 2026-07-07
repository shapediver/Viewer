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
import * as https from "https";
import * as path from "path";

const PACKAGE_PATH = path.resolve(
	__dirname,
	"../../api/default/package.json",
);

interface VersionResult {
	version: string;
}

const GITHUB_PACKAGES_ORG = "shapediver";

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

function computeReleaseVersion(current: string, releaseType: string): string {
	const parsed = parseVersion(current);
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

function getBaseVersion(current: string): string {
	const parsed = parseVersion(current);
	return `${parsed.major}.${parsed.minor}.${parsed.patch}`;
}

function getPackageName(): string {
	try {
		const pkg = JSON.parse(fs.readFileSync(PACKAGE_PATH, "utf8"));
		if (!pkg.name) throw new Error("No name field in package.json");
		return pkg.name;
	} catch (e: any) {
		throw new Error(
			`Failed to read package name from ${PACKAGE_PATH}: ${e.message}`,
		);
	}
}

function getGitHubToken(): string | undefined {
	return process.env.GITHUB_TOKEN || process.env.NODE_AUTH_TOKEN;
}

function fetchGitHubPackageVersions(
	org: string,
	packageName: string,
	token: string,
	page = 1,
	versions: string[] = [],
): Promise<string[]> {
	const encodedPackageName = encodeURIComponent(packageName);
	const pathName = `/orgs/${org}/packages/npm/${encodedPackageName}/versions?per_page=100&page=${page}`;

	return new Promise((resolve, reject) => {
		const request = https.request(
			{
				hostname: "api.github.com",
				path: pathName,
				method: "GET",
				headers: {
					Accept: "application/vnd.github+json",
					Authorization: `Bearer ${token}`,
					"User-Agent": "shapediver-viewer-release-script",
					"X-GitHub-Api-Version": "2022-11-28",
				},
			},
			(response) => {
				let body = "";
				response.setEncoding("utf8");
				response.on("data", (chunk) => (body += chunk));
				response.on("end", () => {
					if (response.statusCode && response.statusCode >= 400) {
						reject(
							new Error(
								`GitHub Packages version lookup failed (${response.statusCode}): ${body}`,
							),
						);
						return;
					}

					let pageVersions: string[];
					try {
						const parsed = JSON.parse(body);
						if (!Array.isArray(parsed)) {
							throw new Error("Expected an array response");
						}
						pageVersions = parsed
							.map((version: any) => version.name)
							.filter((name: any): name is string => typeof name === "string");
					} catch (e: any) {
						reject(
							new Error(
								`Failed to parse GitHub Packages response: ${e.message}`,
							),
						);
						return;
					}

					const allVersions = [...versions, ...pageVersions];
					const link = response.headers.link || "";
					if (link.includes('rel="next"')) {
						fetchGitHubPackageVersions(
							org,
							packageName,
							token,
							page + 1,
							allVersions,
						).then(resolve, reject);
						return;
					}

					resolve(allVersions);
				});
			},
		);

		request.on("error", reject);
		request.end();
	});
}

function computePrereleaseVersionFromPublishedVersions(
	baseVersion: string,
	suffix: string,
	publishedVersions: string[],
): string {
	const escapedSuffix = suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const matcher = new RegExp(
		`^${baseVersion.replace(/\./g, "\\.")}-${escapedSuffix}\\.(\\d+)$`,
	);

	let maxCounter = -1;
	for (const version of publishedVersions) {
		const match = version.match(matcher);
		if (!match) continue;
		const counter = parseInt(match[1], 10);
		if (Number.isInteger(counter)) {
			maxCounter = Math.max(maxCounter, counter);
		}
	}

	return `${baseVersion}-${suffix}.${maxCounter + 1}`;
}

function computePrereleaseVersionFromCurrent(current: string, suffix: string): string {
	const parsed = parseVersion(current);
	const baseVersion = `${parsed.major}.${parsed.minor}.${parsed.patch}`;
	if (parsed.prerelease === suffix) {
		return `${baseVersion}-${suffix}.${parsed.counter + 1}`;
	}
	return `${baseVersion}-${suffix}.0`;
}

async function computeVersion(
	current: string,
	channel: string,
	releaseType?: string,
): Promise<{version: string; source: string}> {
	if (channel === "release") {
		return {version: computeReleaseVersion(current, releaseType!), source: "package"};
	}

	// dev or next channel
	const suffix = channel; // "dev" or "next"
	const explicitCounter = process.env.RELEASE_PRERELEASE_COUNTER;
	const baseVersion = getBaseVersion(current);
	if (explicitCounter) {
		const counter = parseInt(explicitCounter, 10);
		if (!Number.isInteger(counter) || counter < 0) {
			throw new Error(
				`Invalid RELEASE_PRERELEASE_COUNTER: "${explicitCounter}". Must be a non-negative integer.`,
			);
		}
		return {version: `${baseVersion}-${suffix}.${counter}`, source: "env"};
	}

	const token = getGitHubToken();
	if (token) {
		const packageName = getPackageName();
		const publishedVersions = await fetchGitHubPackageVersions(
			GITHUB_PACKAGES_ORG,
			packageName,
			token,
		);
		return {
			version: computePrereleaseVersionFromPublishedVersions(
				baseVersion,
				suffix,
				publishedVersions,
			),
			source: "github-packages",
		};
	}

	if (process.env.GITHUB_ACTIONS === "true") {
		throw new Error(
			"GITHUB_TOKEN or NODE_AUTH_TOKEN is required to compute dev/next prerelease versions from GitHub Packages in CI.",
		);
	}

	return {
		version: computePrereleaseVersionFromCurrent(current, suffix),
		source: "package-fallback",
	};
}

async function main() {
	const {channel, releaseType, silent} = parseArgs();
	const current = readCurrentVersion();
	const {version: next, source} = await computeVersion(current, channel, releaseType);
	const result: VersionResult = {version: next};

	if (!silent) {
		console.log(`Current: ${current}`);
		console.log(`Channel: ${channel}`);
		console.log(`Source:  ${source}`);
		if (releaseType) console.log(`Type:    ${releaseType}`);
		console.log(`Next:    ${next}`);
	}

	// Always output JSON on stdout (for CI consumption)
	console.log(JSON.stringify(result));
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});