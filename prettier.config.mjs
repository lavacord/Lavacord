/**
 * @type {import("prettier").Config}
 */
const config = {
	endOfLine: "lf",
	printWidth: 150,
	quoteProps: "as-needed",
	semi: true,
	singleQuote: false,
	tabWidth: 4,
	trailingComma: "none",
	useTabs: true,
	overrides: [
		{
			files: ["*.json", "*.json5"],
			options: {
				useTabs: false,
				tabWidth: 2,
				singleQuote: true,
				trailingComma: "all",
				quoteProps: "as-needed"
			}
		},
		{
			files: ["*.md"],
			options: {
				useTabs: false,
				tabWidth: 2,
				singleQuote: false,
				trailingComma: "none"
			}
		}
	]
};

export default config;
