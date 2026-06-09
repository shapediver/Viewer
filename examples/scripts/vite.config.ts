import {readFileSync} from "fs";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";
import {defineConfig} from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const license = readFileSync(resolve(__dirname, "../../LICENSE"), "utf-8");

export default defineConfig({
	base: "./",
	build: {
		outDir: "dist",
		commonjsOptions: {
			include: [/node_modules/, /\/dist\//],
		},
		rollupOptions: {
			output: {
				entryFileNames: "bundle.js",
				chunkFileNames: "bundle-[name].js",
				assetFileNames: "[name].[ext]",
				banner: `/*\n${license}\n*/`,
			},
		},
	},
	resolve: {
		alias: {
			"@shapediver/viewer": resolve(
				__dirname,
				"../../api/default/src/index.ts",
			),
			"@shapediver/viewer.shared.demo-helper": resolve(
				__dirname,
				"../../shared/demo-helper/src/index.ts",
			),
		},
	},
	optimizeDeps: {
		include: [
			"@shapediver/viewer",
			"@shapediver/viewer.shared.demo-helper",
		],
	},

	server: {
		open: true,
		port: 8080,
	},
});
