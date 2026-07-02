/**
 * Release Channel Configuration
 *
 * Single source of truth for all release channel behavior.
 * Used by: scripts, GitHub Actions workflows, local CLI.
 */
export interface ReleaseChannel {
	/** Human-readable channel name */
	channel: "dev" | "next" | "release";
	/** Git branch that triggers this channel */
	branch: string;
	/** Prerelease suffix appended to version (null for stable releases) */
	prereleaseSuffix: string | null;
	/** S3 bucket name */
	s3Bucket: string;
	/** S3 key prefix (version is appended by deploy scripts) */
	s3Prefix: string;
	/** Publish to npm registry */
	publishNpm: boolean;
	/** Publish to GitHub Packages */
	publishGithub: boolean;
	/** npm dist-tag to use */
	npmTag: string;
	/** Whether to promote assets to v3/latest after successful deployment */
	promoteToLatest: boolean;
	/** Whether to create a git tag */
	createGitTag: boolean;
	/** S3 bucket name for test-cdn deploys (same as main bucket unless overridden) */
	testS3Bucket?: string;
	/** S3 key prefix for test-cdn deploys */
	testS3Prefix?: string;
}

export const CHANNELS: Record<string, ReleaseChannel> = {
	dev: {
		channel: "dev",
		branch: "development",
		prereleaseSuffix: "dev",
		s3Bucket: "shapediverviewer",
		s3Prefix: "v3/development",
		publishNpm: false,
		publishGithub: true,
		npmTag: "dev",
		promoteToLatest: false,
		createGitTag: false,
		testS3Bucket: "shapediverviewer",
		testS3Prefix: "v3/development",
	},
	next: {
		channel: "next",
		branch: "staging",
		prereleaseSuffix: "next",
		s3Bucket: "shapediverviewer",
		s3Prefix: "v3/staging",
		publishNpm: false,
		publishGithub: true,
		npmTag: "next",
		promoteToLatest: false,
		createGitTag: false,
		testS3Bucket: "shapediverviewer",
		testS3Prefix: "v3/staging",
	},
	release: {
		channel: "release",
		branch: "main",
		prereleaseSuffix: null,
		s3Bucket: "shapediverviewer",
		s3Prefix: "v3",
		publishNpm: true,
		publishGithub: true,
		npmTag: "latest",
		promoteToLatest: true,
		createGitTag: true,
		testS3Bucket: "shapediverviewer",
		testS3Prefix: "v3",
	},
};

/**
 * Get channel config for a given channel name.
 */
export function getChannel(channel: string): ReleaseChannel {
	const c = CHANNELS[channel];
	if (!c) throw new Error(`Unknown channel: ${channel}. Valid: ${Object.keys(CHANNELS).join(", ")}`);
	return c;
}

/**
 * Get channel config for a given branch name.
 */
export function getChannelByBranch(branch: string): ReleaseChannel | undefined {
	return Object.values(CHANNELS).find((c) => c.branch === branch);
}

/**
 * Version of the S3 deploy prefix for a channel.
 * Returns the full prefix path including the version number.
 */
export function getS3DeployPrefix(channel: string, version: string): string {
	const c = getChannel(channel);
	return `${c.s3Prefix}/${version}`;
}

/**
 * Version of the S3 path for test-cdn deployment for a channel.
 */
export function getS3TestPrefix(channel: string, version: string): string {
	const c = getChannel(channel);
	const base = c.testS3Prefix ?? c.s3Prefix;
	return `${base}/${version}/test-cdn`;
}

/**
 * Returns the channel-appropriate npm dist-tag flag for lerna publish.
 */
export function getNpmTagFlag(channel: string): string {
	const c = getChannel(channel);
	return c.npmTag;
}