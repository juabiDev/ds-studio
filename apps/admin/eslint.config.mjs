import { FlatCompat } from "@eslint/eslintrc";

// eslint-config-next 15 still ships legacy presets; FlatCompat adapts them to ESLint 9 flat config
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
