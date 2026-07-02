/* eslint-disable @typescript-eslint/no-var-requires */
import {S3} from "@aws-sdk/client-s3";
import * as fs from "fs";
import pako from "pako";

const {exec} = require("child_process");
const recursiveReadSync = require("recursive-readdir-sync");
const readline = require("readline");

// ---- Default S3 config (used by legacy functions) ----
const s3 = new S3({maxAttempts: 5, region: "us-east-1"});
const bucketName = "shapediverviewer";
const prefixLatest = "v3/latest";

// ---- Shared helpers ----

/**
 * Determine Content-Type for a file based on its extension.
 */
export function getContentType(filePath: string): string {
	if (filePath.endsWith(".js") || filePath.endsWith(".js.map"))
		return "text/javascript";
	if (filePath.endsWith(".html")) return "text/html";
	if (filePath.endsWith(".css")) return "text/css";
	if (filePath.endsWith(".png")) return "image/png";
	return "text/plain";
}

/**
 * Determine cache-control header based on deployment type.
 */
export function getCacheControl(
	name?: string,
	prefix?: string,
): string {
	if (name && name.startsWith("test")) {
		// test examples: no browser cache, CDN cache for 1 week
		return "max-age=0, s-maxage=608400, must-revalidate";
	}
	if (prefix && prefix.includes("demos")) {
		// demos: no browser cache, CDN cache for 1 week
		return "max-age=0, s-maxage=608400, must-revalidate";
	}
	// default: browser cache 1 hour, CDN cache 1 week
	return "max-age=3600, s-maxage=608400, must-revalidate";
}

/**
 * Upload a single file to S3 with gzip compression and public-read ACL.
 */
export function uploadFileToS3(
	filePath: string,
	key: string,
	bucket: string = bucketName,
	cacheControl?: string,
) {
	s3.putObject(
		{
			Bucket: bucket,
			Key: key,
			Body: pako.gzip(fs.readFileSync(filePath)),
			ACL: "public-read",
			ContentType: getContentType(filePath),
			CacheControl: cacheControl || getCacheControl(),
			ContentEncoding: "gzip",
		},
		(err) => {
			if (err) console.log(err);
		},
	);
}

/**
 * Upload all files from a directory to S3 under a given key prefix.
 */
export function uploadDirectoryToS3(
	directoryPath: string,
	keyPrefix: string,
	bucket: string = bucketName,
	cacheControl?: string,
) {
	const fileContents = <string[]>recursiveReadSync(directoryPath);
	fileContents.map(function (f) {
		const key =
			keyPrefix +
			f.substring(directoryPath.length, f.length).replace(/\\/g, "/");
		uploadFileToS3(f, key, bucket, cacheControl);
	});
}

// ---- Legacy functions (kept for backward compatibility) ----

export const execPromise = (cmd: string): Promise<string> => {
	return new Promise((resolve, reject) => {
		const process = exec(cmd, (error: any, stdout: any) => {
			if (error) reject(error);
			if (!error && typeof stdout === "string")
				resolve(stdout.replace("\n", ""));
		});

		process.stdout.on("data", (data: any) => {
			console.log(data);
		});
	});
};

export const getDirectories = async (source: string): Promise<string[]> =>
	(await fs.promises.readdir(source, {withFileTypes: true}))
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => dirent.name as string);

export const deployToS3 = (
	directoryPath: string,
	name?: string,
	prefix?: string,
) => {
	deployToS3Latest(directoryPath, name);
	deployToS3Folder(directoryPath, name, prefix);
};

export const deployToS3Latest = (directoryPath: string, name?: string) => {
	const fileContents = <string[]>recursiveReadSync(directoryPath);

	const cacheControl = getCacheControl(name);

	// deploy under latest prefix
	fileContents.map(function (f) {
		const key =
			(name ? prefixLatest + "/" + name : prefixLatest) +
			f.substring(directoryPath.length, f.length).replace(/\\/g, "/");
		uploadFileToS3(f, key, bucketName, cacheControl);
	});
};

export const deployToS3Folder = (
	directoryPath: string,
	name?: string,
	prefix?: string,
) => {
	if (!prefix) return;

	const cacheControl = getCacheControl(name, prefix);
	const fileContents = <string[]>recursiveReadSync(directoryPath);

	fileContents.map(function (f) {
		const key =
			(name ? prefix + "/" + name : prefix) +
			f.substring(directoryPath.length, f.length).replace(/\\/g, "/");
		uploadFileToS3(f, key, bucketName, cacheControl);
	});
};

export const readAnswer = async (question: string): Promise<string> => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	return await new Promise<string>((resolve) => {
		rl.question(question, (answer: string) => {
			rl.close();
			resolve(answer);
		});
	});
};

export const readAnswerOptions = async (
	question: string,
	options: string[],
): Promise<string> => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	return await new Promise<string>((resolve, reject) => {
		rl.question(question, (answer: string) => {
			rl.close();
			if (options.includes(answer)) {
				resolve(answer);
			} else {
				reject("Not a valid example.");
			}
		});
	});
};
