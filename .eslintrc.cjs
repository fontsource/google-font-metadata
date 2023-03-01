require("@ayuhito/eslint-config/patch");

module.exports = {
  extends: ["@ayuhito/eslint-config/profile/node"],
	parserOptions: { tsconfigRootDir: __dirname },
	rules: {
		"@typescript-eslint/no-throw-literal": "off",
	}
};
