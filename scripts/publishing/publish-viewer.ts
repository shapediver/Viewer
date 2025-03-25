/* eslint-disable @typescript-eslint/no-var-requires */
import * as fs from "fs";
import {
	deployToS3,
	deployToS3Latest,
	execPromise,
	readAnswer,
	readAnswerOptions,
} from "../utils/utils";

(async () => {
	try {
		/**
		 * Check if we want to do a public release or release a release candidate.
		 */
		const publicReleasePublishAnswer = await readAnswer(
			"Is this a public release?\n",
		);
		const publicRelease =
			publicReleasePublishAnswer === "yes" ||
			publicReleasePublishAnswer === "y";

		/**
		 * Read out the components of the version to see if we already have a release-candidate.
		 */
		const packageJson = require("../../api/default/package.json");
		const versionComponents: string[] = packageJson.version.split("-");

		// if this was already a release-candidate (versionComponents.length > 1) we don't need to ask for the version, as it was already updated.
		let versionInput = "";
		let newReleaseCandidateVersion = false;
		if (versionComponents.length === 1) {
			/**
			 * How do we increment the version?
			 */
			versionInput = await readAnswerOptions(
				"Which part of the version would you like to increment? (major, minor, patch)\n",
				["major", "minor", "patch"],
			);
		} else {
			/**
			 * How do we increment the version?
			 */
			const option = await readAnswer(
				"Would you like to increase a different version than specified in the release candidate?\n",
			);

			if (option === "yes" || option === "y") {
				versionInput = await readAnswerOptions(
					"Which part of the version would you like to increment? (major, minor, patch)\n",
					["major", "minor", "patch"],
				);
				newReleaseCandidateVersion = true;
			}
		}

		/**
		 * Check for changes that have not been committed.
		 */
		const changes = await execPromise("git status --porcelain");
		if (changes) {
			throw new Error(
				`Please stage and commit your files first.\n${changes}`,
			);
		} else {
			console.log(changes);
		}

		console.log("checking versioning...");

		/**
		 * update of the version depending on the input for
		 * release-candidate and version
		 */
		let newVersion: string;
		if (versionComponents.length === 1 || newReleaseCandidateVersion) {
			// in both cases below we increase the version, in the release candidate (non-publicRelease) case we add a suffix

			const versions: string[] = packageJson.version.split(".");
			newVersion =
				+versions[0] +
				(versionInput === "major" ? 1 : 0) +
				"." +
				(versionInput === "major"
					? 0
					: +versions[1] + (versionInput === "minor" ? 1 : 0)) +
				"." +
				(versionInput === "major"
					? 0
					: versionInput === "minor"
						? 0
						: +versions[2] + (versionInput === "patch" ? 1 : 0));

			if (publicRelease) {
				//  default case, public release before, public release now
			} else {
				// public release before, release candidate now
				// we increased the version according to the type of release candidate (patch, minor, major)
				// and add the release candidate suffix
				newVersion += "-rc.0";
			}
		} else {
			if (publicRelease) {
				if (
					versionInput === "major" ||
					versionInput === "minor" ||
					versionInput === "patch"
				) {
					const versions: string[] = versionComponents[0].split(".");
					newVersion =
						+versions[0] +
						(versionInput === "major" ? 1 : 0) +
						"." +
						(versionInput === "major"
							? 0
							: +versions[1] +
								(versionInput === "minor" ? 1 : 0)) +
						"." +
						(versionInput === "major"
							? 0
							: versionInput === "minor"
								? 0
								: +versions[2] +
									(versionInput === "patch" ? 1 : 0));
				} else {
					// in this case we had a release candidate and now do a public release
					// therefore we just remove the release candidate part, as the version has already been updated
					// the type of upgrade is ignored here, but the initial update is used
					newVersion = versionComponents[0];
				}
			} else {
				// in this case, we had a release candidate and have another one
				// therefore we increase the number and disregard the type of upgrade
				const releaseCandidateVersion: string[] =
					versionComponents[1].split(".");
				newVersion =
					versionComponents[0] +
					"-rc." +
					(+releaseCandidateVersion[1] + 1);
			}
		}

		console.log("new version: " + newVersion);

		/**
		 * Update the build-data file
		 */
		const gitCommit: string = <string>(
			await execPromise("git rev-parse HEAD")
		);
		const gitBranch: string = <string>(
			await execPromise("git branch --show-current")
		);
		if (!gitBranch || !gitCommit)
			throw new Error(
				"Could not get git branch or commit for deployment.",
			);
		const timestamp = new Date().toISOString();

		fs.writeFileSync(
			"shared/build-data/src/build_data.ts",
			"export const build_data = " +
				JSON.stringify(
					{
						build_version: "3." + newVersion,
						build_date: timestamp,
						build_branch: gitBranch,
						build_commit: gitCommit,
					},
					null,
					0,
				) +
				";",
		);

		/**
		 * re-build the whole project and all examples
		 */
		console.log("re-building for deployment...");
		console.log(await execPromise("npm run build"));
		console.log(await execPromise("npm run build-examples"));

		if (publicRelease) {
			/**
			 * build the doc
			 */
			console.log("creating doc...");
			console.log(await execPromise("npm run doc"));
		}

		/**
		 * as we have made file changes now, commit them so that lerna version doesn't fail
		 */
		console.log("creating automatic pre-publishing commit...");
		console.log(await execPromise("git add ."));
		console.log(
			await execPromise(
				'git commit -m "automatic pre-publishing commit"',
			),
		);

		/**
		 * update the package versions and delete the created tags
		 */
		console.log(
			await execPromise(
				`lerna version ${newVersion} --yes --no-private --exact --force-publish`,
			),
		);
		console.log(
			await execPromise(
				'git tag -l "@shapediver*" | xargs -n 1 git push --delete origin',
			),
		);
		console.log(
			await execPromise('git tag -l "@shapediver*" | xargs git tag -d'),
		);

		console.log(await execPromise("npm whoami"));

		if (publicRelease) {
			console.log("deploying to s3...");
			const prefix = "v3/" + newVersion;
			deployToS3Latest("examples/doc-version/dist", "doc-version");
			// deploy the api docs
			deployToS3("docs", "api", prefix);
			// deploy the cdn
			deployToS3("examples/cdn/dist", "cdn", prefix);
			deployToS3("examples/cdn/dist", undefined, prefix);
			// deploy the gltf page
			deployToS3("examples/gltf/dist", "gltf", prefix);
			// deploy the main pages
			deployToS3("examples/main-pages", undefined, prefix);
		}

		/**
		 * create a tag for this version and push it
		 */
		await execPromise(
			`git tag -a viewer@${newVersion} -m "deployed viewer version ${newVersion}"`,
		);
		await execPromise(`git push origin viewer@${newVersion}`);

		/**
		 * Package releases to npm and github
		 */
		if (publicRelease) {
			console.log("publishing to npm...");
			console.log(await execPromise("npm run lerna-publish-npm"));
		}

		console.log("publishing to github...");
		console.log(await execPromise("npm run lerna-publish-github"));
	} catch (e) {
		console.log(e);
	}
})();
