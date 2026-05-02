import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ═══════════════════════════════════════════════════════════════════
// ESLint Configuration — Phase 1 Progressive Re-enabling
// ═══════════════════════════════════════════════════════════════════
//
// P2-2 FIX: Previously 25 rules were disabled ("off"). This was too
// permissive and hid real issues. We've progressively re-enabled the
// most impactful rules while keeping some off where they create noise
// without real value in this codebase.
//
// Re-enabled rules (were "off", now "warn" or "error"):
//   - @typescript-eslint/no-unused-vars → "warn" (catch dead code)
//   - prefer-const → "warn" (const correctness)
//   - no-unreachable → "error" (real bug catcher)
//   - no-case-declarations → "warn" (switch block scoping)
//   - no-fallthrough → "error" (accidental switch fallthrough)
//   - @typescript-eslint/prefer-as-const → "warn" (type precision)
//
// Still disabled (intentionally — would create too much noise):
//   - @typescript-eslint/no-explicit-any → Needed for zodResolver, etc.
//   - react-hooks/exhaustive-deps → Too many false positives with refs
//   - no-console → Console logging is intentional for proxy debugging
// ═══════════════════════════════════════════════════════════════════

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    // TypeScript rules — RE-ENABLED
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/prefer-as-const": "warn",

    // TypeScript rules — still disabled (intentional)
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-unused-disable-directive": "off",
    
    // React rules — still disabled
    "react-hooks/exhaustive-deps": "off",
    "react-hooks/purity": "off",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "react/prop-types": "off",
    "react-compiler/react-compiler": "off",
    
    // Next.js rules — still disabled
    "@next/next/no-img-element": "off",
    "@next/next/no-html-link-for-pages": "off",
    
    // General JavaScript rules — RE-ENABLED
    "prefer-const": "warn",
    "no-unreachable": "error",
    "no-case-declarations": "warn",
    "no-fallthrough": "error",

    // General JavaScript rules — still disabled
    "no-unused-vars": "off",
    "no-console": "off",
    "no-debugger": "off",
    "no-empty": "off",
    "no-irregular-whitespace": "off",
    "no-mixed-spaces-and-tabs": "off",
    "no-redeclare": "off",
    "no-undef": "off",
    "no-useless-escape": "off",
  },
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "examples/**", "skills"]
}];

export default eslintConfig;
