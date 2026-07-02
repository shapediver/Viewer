/**
 * promote-latest.ts
 *
 * Promotes a versioned deployment to v3/latest/ by copying assets
 * from the versioned S3 path to the latest path.
 *
 * Usage:
 *   npx ts-node -T scripts/deploy/promote-latest.ts --from-version 3.19.0
 *   npx ts-node -T scripts/deploy/promote-latest.ts --from-version 3.19.0 --dry-run
 *   npx ts-node -T scripts/deploy/promote-latest.ts --from-version 3.19.0 --yes
 *
 * Options:
 *   --from-version   x.y.z version to promote from  (required)
 *   --bucket         S3 bucket name (default: shapediverviewer)
 *   --dry-run        show what would happen without actually copying
 *   --yes            skip confirmation prompt
 */

import {S3, ListObjectsV2Command, CopyObjectCommand} from "@aws-sdk/client-s3";

const s3 = new S3({maxAttempts: 5, region: "us-east-1"});
const DEFAULT_BUCKET = "shapediverviewer";
const LATEST_PREFIX = "v3/latest";

interface PromoteArgs {
	fromVersion: string;
	bucket: string;
	dryRun: boolean;
	silent: boolean;
}

function parseArgs(): PromoteArgs {
	const args = process.argv.slice(2);
	const result: PromoteArgs = {
		fromVersion: "",
		bucket: DEFAULT_BUCKET,
		dryRun: false,
		silent: false,
	};

	for (let i = 0; i < args.length; i++) {
		if (args[i] === "--from-version" && args[i + 1]) result.fromVersion = args[++i];
		else if (args[i] === "--bucket" && args[i + 1]) result.bucket = args[++i];
		else if (args[i] === "--dry-run") result.dryRun = true;
		else if (args[i] === "--yes") result.silent = true;
	}

	if (!result.fromVersion) throw new Error("--from-version is required");

	return result;
}

async function listObjects(bucket: string, prefix: string): Promise<string[]> {
	const keys: string[] = [];
	let continuationToken: string | undefined;

	do {
		const command = new ListObjectsV2Command({
			Bucket: bucket,
			Prefix: prefix,
			ContinuationToken: continuationToken,
		});
		const response = await s3.send(command);

		if (response.Contents) {
			for (const obj of response.Contents) {
				if (obj.Key) keys.push(obj.Key);
			}
		}

		continuationToken = response.NextContinuationToken;
	} while (continuationToken);

	return keys;
}

async function copyObject(
	bucket: string,
	sourceKey: string,
	destKey: string,
): Promise<void> {
	const command = new CopyObjectCommand({
		Bucket: bucket,
		CopySource: `/${bucket}/${encodeURIComponent(sourceKey)}`,
		Key: destKey,
		ACL: "public-read",
		MetadataDirective: "COPY",
		TaggingDirective: "COPY",
	});
	await s3.send(command);
}

async function main() {
	const {fromVersion, bucket, dryRun, silent} = parseArgs();
	const sourcePrefix = `v3/${fromVersion}`;

	if (!silent) {
		console.log(`\n=== Promote to Latest ===`);
		console.log(`  From:  s3://${bucket}/${sourcePrefix}/`);
		console.log(`  To:    s3://${bucket}/${LATEST_PREFIX}/`);
		console.log("");
	}

	if (dryRun) {
		if (!silent) {
			console.log(`  Would copy all objects from s3://${bucket}/${sourcePrefix}/`);
			console.log(`  to s3://${bucket}/${LATEST_PREFIX}/`);
			console.log(`  preserving cache-control headers and metadata.`);
			console.log(`\n[dry-run] No files copied.`);
		}
		console.log(JSON.stringify({fromVersion, bucket, dryRun: true}));
		return;
	}

	// List all objects under the versioned prefix
	const sourceKeys = await listObjects(bucket, sourcePrefix);

	if (sourceKeys.length === 0) {
		console.log(`No objects found at s3://${bucket}/${sourcePrefix}/`);
		process.exit(1);
	}

	if (!silent) {
		console.log(`  Found ${sourceKeys.length} objects to copy`);
	}

	if (!silent) {
		console.log("Proceed with promotion? (y/N) ");
		const input = require("fs").readFileSync(0, "utf8").trim().toLowerCase();
		if (input !== "y" && input !== "yes") {
			console.log("Aborted.");
			process.exit(1);
		}
	}

	// Copy each object from versioned path to latest path
	let copied = 0;
	for (const key of sourceKeys) {
		const destKey = key.replace(sourcePrefix, LATEST_PREFIX);
		if (!silent && copied % 50 === 0) {
			process.stdout.write(`\r  Copying ${copied}/${sourceKeys.length}...`);
		}
		await copyObject(bucket, key, destKey);
		copied++;
	}

	if (!silent) {
		process.stdout.write(`\r  Copied ${copied}/${sourceKeys.length} objects.\n`);
		console.log(`\nPromotion complete: s3://${bucket}/${LATEST_PREFIX}/`);
	}

	console.log(JSON.stringify({fromVersion, bucket, objectCount: copied, dryRun: false}));
}

main().catch((err) => {
	console.error("Promotion failed:", err);
	process.exit(1);
});