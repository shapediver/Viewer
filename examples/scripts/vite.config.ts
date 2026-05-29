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
	server: {
		open: true,
	},
});
