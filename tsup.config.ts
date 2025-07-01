import { esbuildPluginFilePathExtensions } from "esbuild-plugin-file-path-extensions";
import { esbuildPluginVersionInjector } from "esbuild-plugin-version-injector";
import { defineConfig, type Options } from "tsup";

const baseOptions: Options = {
	clean: true,
	entry: ["src/**/*.ts"],
	dts: true,
	minify: false,
	skipNodeModulesBundle: true,
	sourcemap: true,
	target: "node20",
	keepNames: true,
	treeshake: true,
	esbuildPlugins: [esbuildPluginFilePathExtensions(), esbuildPluginVersionInjector()],
	tsconfig: "tsconfig.json"
};

export default [
	defineConfig({
		...baseOptions,
		outDir: "dist/cjs",
		format: "cjs",
		outExtension: () => ({ js: ".cjs" })
	}),
	defineConfig({
		...baseOptions,
		outDir: "dist/esm",
		format: "esm"
	})
];
