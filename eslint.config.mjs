 import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    rules: {
  "@typescript-eslint/no-explicit-any": "off",
  "react-hooks/set-state-in-effect": "off",
  "react-hooks/immutability": "off",
  "@next/next/no-img-element": "warn",
  "@next/next/no-html-link-for-pages": "off",
  "@typescript-eslint/no-unused-vars": "warn",
},
  },

  globalIgnores([
    ".next/**",
    "node_modules/**",
    "out/**",
    "dist/**",
    "lib/supabase/database.types.ts",
  ]),
])

export default eslintConfig