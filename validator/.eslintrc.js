module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:prettier/recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
  ],
  env: {
    node: true,
    mocha: true,
  },
  plugins: ["@typescript-eslint", "import"],
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 8,
  },
  rules: {
    "@typescript-eslint/no-empty-function": 1,
    "@typescript-eslint/no-var-requires": 1,
    "import/order": "error",
    "import/no-named-as-default": 0,
  },
  settings: {
    "import/resolver": {
      typescript: true,
    },
  },
};
