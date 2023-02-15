import * as fs from "fs"
import { deployToS3, execPromise, getDirectories } from "../utils/utils"

(async (arg_dryRun: string, arg_noGit: String, arg_components: string, arg_registries: string) => {
    try {
        /**
         * Parse arguments
         */
        const dryRun = (arg_dryRun == "True")
        const noGit = (arg_noGit == "True")
        const components: {
            "component": {
                "name": string,
                "version": string,
                "location": string,
                "private": boolean
            },
            "new_version": string
        }[] = JSON.parse(arg_components)
        const registries: {
            "name": "github" | "npm",
            "url": string
        }[] = JSON.parse(arg_registries)

        // Sanity check: We want to deploy all components with the same version.
        const unique_versions = new Set(components.map(c => c.new_version))
        if (unique_versions.size > 1) throw new Error("Found different versions in publishable components.\"")

        /**
         * Run tests
         */
        console.log("deploying tests...")
        await execPromise(`npm run deploy-tests`)

        console.log("starting tests...")
        await execPromise(`npm run test`)

        /**
         * Create build-data file.
         */
        const newVersion = Array.from(unique_versions)[0]
        const git_commit: string = <string>await execPromise("git rev-parse HEAD")
        const git_branch: string = <string>await execPromise("git branch --show-current")
        if (!git_branch || !git_commit) throw new Error("Could not get git branch or commit for deployment.")
        const timestamp = new Date().toISOString()

        fs.writeFileSync("shared/build-data/src/build_data.ts", "export const build_data = " + JSON.stringify({
            build_version: "3." + newVersion,
            build_date: timestamp,
            build_branch: git_branch,
            build_commit: git_commit,
        }, null, 0) + ";")

        /**
         * Build components, create documentation, and commit all changed files.
         */
        console.log("re-building for deployment...")
        console.log(await execPromise("npm run build-current"))
        console.log(await execPromise("npm run build-prod"))

        console.log("creating doc...")
        console.log(await execPromise("npm run doc"))

        if (!noGit) {
            console.log("creating automatic pre-publishing commit...")
            console.log(await execPromise("git add ."))
            console.log(await execPromise("git commit -m \"automatic pre-publishing commit\""))
        } else {
            console.warn("skipping creation automatic pre-publishing commit")
        }

        /**
         * Upload documentation and examples to S3.
         */
        const npm_publish = registries.some(r => r.name === "npm")
        const prefix = "v3/" + newVersion

        if (!dryRun) {
            if (npm_publish) {
                console.log("deploying to s3...")
                deployToS3("docs", "api", prefix, true)

                const examples = await getDirectories("examples")

                for (let i = 0; i < examples.length; i++) {
                    console.log("deploying example " + (i + 1) + "/" + examples.length + "...")
                    const example = examples[i]
                    if (example === "main-pages") continue
                    console.log(await execPromise("cd examples/" + example + " && npm run build-prod && cd ../.."))
                    deployToS3("examples/" + example + "/dist-prod", example, prefix, true)
                }
            }

            deployToS3("examples/cdn/dist-prod", undefined, prefix, true)
            deployToS3("examples/main-pages", undefined, prefix, true)
        } else {
            console.warn("skipping deployment to S3")
        }

    } catch (e) {
        console.log(e)
        process.exit(1)
    }
})(
    process.argv[2] || "False",
    process.argv[3] || "False",
    process.argv[4] || "[]",
    process.argv[5] || "[]",
)
