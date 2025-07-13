module.exports = {
  extends: ["next/core-web-vitals"],
  rules: {
    // Turn off strict TypeScript rules
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-expressions": "off",
    "@typescript-eslint/ban-types": "off",
    "@typescript-eslint/no-empty-function": "off",
    
    // Turn off React hook rules that are too strict
    "react-hooks/exhaustive-deps": "off",
    "react-hooks/rules-of-hooks": "off",
    
    // Turn off other strict rules
    "prefer-const": "off",
    "no-console": "off",
    "no-unused-vars": "off",
    "no-undef": "off",
    
    // Turn off Next.js image optimization warnings
    "@next/next/no-img-element": "off",
    
    // Turn off React unescaped entities warnings
    "react/no-unescaped-entities": "off",
    
    // Keep only essential rules
    "react/jsx-uses-react": "error",
    "react/jsx-uses-vars": "error"
  }
};
