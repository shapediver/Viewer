/**
 * deploy-s3.ts
 *
 * Deploys built assets to S3 for a given release channel.
 *
 * Usage:
 *   npx ts-node -T scripts/deploy/deploy-s3.ts --channel dev --version 3.19.0-dev.1 --source-dir ./dist
 *   npx ts-node -T scripts/deploy/deploy-s3.ts --channel release --version 3.19.0 --source-dir ./dist --test-cdn
 *   npx ts-node -T scripts/deploy/deploy-s3.ts --channel next --version 3.19.0-next.1 --source-dir ./dist --dry-run
 *   npx ts-node -T scripts/deploy/deploy-s3.ts --channel dev --version 3.19.0-dev.1 --source-dir ./dist --yes
 *
 * Options:
 *   --channel      dev | next | release  (required)
 *   --version      x.y.z or prerelease   (required)
 *   --source-dir   path to built assets   (required)
 *   --test-cdn     flag: deploy as test-cdn instead of main assets
 *   --dry-run      flag: show target paths without uploading
 *   --yes          flag: skip confirmation prompt
 */

import * as path from "path";
import {getChannel, getS3DeployPrefix, getS3TestPrefix} from "../config/release-channels";
import {uploadDirectoryToS3} from "../utils/utils";

interface DeployArgs {
	channel: string;
	version: string;
	sourceDir: string;
	isTestCdn: boolean;
	dryRun: boolean;
	silent: boolean;
}

function parseArgs(): DeployArgs {
	const args = process.argv.slice(2);
	const result: DeployArgs = {
		channel: "",
		version: "",
		sourceDir: "",
		isTestCdn: false,
		dryRun: false,
		silent: false,
	};

	for (let i = 0; i < args.length; i++) {
		if (args[i] === "--channel" && args[i + 1]) result.channel = args[++i];
		else if (args[i] === "--version" && args[i + 1]) result.version = args[++i];
		else if (args[i] === "--source-dir" && args[i + 1]) result.sourceDir = args[++i];
		else if (args[i] === "--test-cdn") result.isTestCdn = true;
		else if (args[i] === "--dry-run") result.dryRun = true;
		else if (args[i] === "--yes") result.silent = true;
	}

	if (!result.channel) throw new Error("--channel is required (dev|next|release)");
	if (!result.version) throw new Error("--version is required");
	if (!result.sourceDir) throw new Error("--source-dir is required");

	return result;
}

function main() {
	const {channel, version, sourceDir, isTestCdn, dryRun, silent} = parseArgs();
	const cfg = getChannel(channel);

	// Resolve the source directory to an absolute path
	const resolvedSource = path.resolve(sourceDir);

	// Compute the target prefix
	let targetPrefix: string;
	let targetBucket: string;

	if (isTestCdn) {
		targetPrefix = getS3TestPrefix(channel, version);
		targetBucket = cfg.testS3Bucket ?? cfg.s3Bucket;
	} else {
		targetPrefix = getS3DeployPrefix(channel, version);
		targetBucket = cfg.s3Bucket;
	}

	if (!silent) {
		console.log(`\n=== S3 Deploy: ${channel} ===`);
		console.log(`  Channel:    ${channel}`);
		console.log(`  Version:    ${version}`);
		console.log(`  Source:     ${resolvedSource}`);
		console.log(`  Target:     s3://${targetBucket}/${targetPrefix}/`);
		console.log(`  Type:       ${isTestCdn ? "test-cdn" : "main assets"}`);
		console.log("");
	}

	if (dryRun) {
		console.log("[dry-run] No files uploaded. Would deploy to:");
		console.log(`  s3://${targetBucket}/${targetPrefix}/`);
		console.log(JSON.stringify({channel, version, prefix: targetPrefix, bucket: targetBucket, dryRun: true}));
		return;
	}

	if (!silent) {
		console.log("Proceed with upload? (y/N) ");
		const input = require("fs").readFileSync(0, "utf8").trim().toLowerCase();
		if (input !== "y" && input !== "yes") {
			console.log("Aborted.");
			process.exit(1);
		}
	}

	if (!silent) console.log("Uploading...\n");

	uploadDirectoryToS3(resolvedSource, targetPrefix, targetBucket);

	if (!silent) {
		console.log(`\nDeploy complete: s3://${targetBucket}/${targetPrefix}/`);
	}

	console.log(JSON.stringify({channel, version, prefix: targetPrefix, bucket: targetBucket, dryRun: false}));
}

main();