import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: ["zip export/**"],
  },
  ...nextVitals,
  ...nextTypescript,
];

export default eslintConfig;
