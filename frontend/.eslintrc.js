module.exports = {
   root: true,
   env: {
      node: true,
      es2021: true,
   },
   extends: ["plugin:vue/vue3-essential", "eslint:recommended", "@vue/eslint-config-prettier"],
   parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
   },
   plugins: ["vue", "prettier"],
   rules: {
      "prettier/prettier": "error",
      "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
      "vue/multi-word-component-names": "off",
   },
   overrides: [
      {
         files: ["**/__tests__/*.{j,t}s?(x)", "**/tests/unit/**/*.spec.{j,t}s?(x)"],
         env: {
            jest: true,
         },
      },
   ],
   ignorePatterns: ["dist/", "dev-dist/", "node_modules/"],
};
