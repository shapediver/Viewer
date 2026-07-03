import {
	execPromise,
	readAnswer,
	readAnswerOptions,
} from "../utils/utils";

async function getJsonField(command: string, field: string): Promise<string> {
	const raw = await execPromise(command);
	return JSON.parse(raw)[field];
}

(async () => {
	try {
		const branch = await execPromise("git branch --show-current");
		if (branch !== "main") {
			const proceed = await readAnswer(
				`Current branch is '${branch}'. This local release helper is intended for 'main'. Continue anyway? (yes/no)\n`,
			);
			if (proceed !== "yes" && proceed !== "y") {
				throw new Error("Aborted: local release helper should normally run from main.");
			}
		}

		const changes = await execPromise("git status --porcelain");
		if (changes) {
			throw new Error(`Please stage and commit your files first.\n${changes}`);
		}

		const releaseType = await readAnswerOptions(
			"Which release type would you like to create? (patch, minor, major)\n",
			["patch", "minor", "major"],
		);

		const version = await getJsonField(
			`npx ts-node -T ./scripts/release/compute-version.ts --channel release --release-type ${releaseType} --yes`,
			"version",
		);

		console.log(`Computed release version: ${version}`);

		const confirm = await readAnswer(
			`Proceed with local release for ${version}? This will build, deploy, test, publish, commit, and tag. (yes/no)\n`,
		);
		if (confirm !== "yes" && confirm !== "y") {
			throw new Error("Aborted.");
		}

		console.log("Versioning packages...");
		console.log(
			await execPromise(
				`npx lerna version ${version} --yes --no-private --exact --force-publish --no-git-tag-version --no-push`,
			),
		);

		console.log("Generating build data...");
		const gitCommit = (await execPromise("git rev-parse HEAD")).trim();
		const buildDate = new Date().toISOString();
		process.env.BUILD_VERSION = version;
		process.env.BUILD_DATE = buildDate;
		process.env.GITHUB_SHA = gitCommit;
		process.env.GITHUB_REF_NAME = "main";
		console.log(
			await execPromise("npx ts-node -T ./scripts/release/generate-build-data.ts"),
		);
		delete process.env.BUILD_VERSION;
		delete process.env.BUILD_DATE;
		delete process.env.GITHUB_SHA;
		delete process.env.GITHUB_REF_NAME;

		console.log("Building packages...");
		console.log(await execPromise("npm run build"));
		console.log(await execPromise("npm run build-tests"));
		console.log(await execPromise("npm run build-examples"));
		console.log(await execPromise("npm run doc"));

		console.log("Deploying versioned assets...");
		console.log(
			await execPromise(
				`npx ts-node -T ./scripts/deploy/deploy-s3.ts --channel release --version ${version} --source-dir ./docs --target-name api --yes`,
			),
		);
		console.log(
			await execPromise(
				`npx ts-node -T ./scripts/deploy/deploy-s3.ts --channel release --version ${version} --source-dir ./examples/cdn/dist --target-name cdn --yes`,
			),
		);
		console.log(
			await execPromise(
				`npx ts-node -T ./scripts/deploy/deploy-s3.ts --channel release --version ${version} --source-dir ./examples/cdn/dist --yes`,
			),
		);
		console.log(
			await execPromise(
				`npx ts-node -T ./scripts/deploy/deploy-s3.ts --channel release --version ${version} --source-dir ./examples/gltf/dist --target-name gltf --yes`,
			),
		);
		console.log(
			await execPromise(
				`npx ts-node -T ./scripts/deploy/deploy-s3.ts --channel release --version ${version} --source-dir ./examples/main-pages --yes`,
			),
		);
		console.log(
			await execPromise(
				`npx ts-node -T ./scripts/deploy/deploy-s3.ts --channel release --version ${version} --source-dir ./examples/test-cdn/dist --test-cdn --yes`,
			),
		);

		console.log("Running Playwright against versioned release...");
		console.log(await execPromise("npm run test-install"));
		const testBaseUrl = `https://viewer.shapediver.com/v3/${version}`;
		process.env.VIEWER_TEST_BASE_URL = testBaseUrl;
		console.log(
			await execPromise("npm run test"),
		);
		delete process.env.VIEWER_TEST_BASE_URL;

		console.log("Publishing GitHub Packages...");
		console.log(
			await execPromise(
				"npx ts-node -T ./scripts/publish/publish-github.ts --tag latest --yes",
			),
		);

		console.log("Publishing npm packages...");
		console.log(
			await execPromise(
				"npx ts-node -T ./scripts/publish/publish-npm.ts --yes",
			),
		);

		console.log("Promoting latest...");
		console.log(
			await execPromise(
				`npx ts-node -T ./scripts/deploy/promote-latest.ts --from-version ${version} --yes`,
			),
		);

		console.log("Committing and tagging release...");
		console.log(await execPromise("git add -A"));
		console.log(
			await execPromise(`git commit -m "chore(release): release ${version}"`),
		);
		console.log(await execPromise("git push origin HEAD:main"));
		console.log(
			await execPromise(
				`git tag -a viewer@${version} -m "deployed viewer version ${version}"`,
			),
		);
		console.log(await execPromise(`git push origin viewer@${version}`));

		console.log(`Release ${version} completed.`);
	} catch (e) {
		console.log(e);
	}
})();
