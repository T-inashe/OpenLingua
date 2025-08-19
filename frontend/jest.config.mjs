// jest.config.mjs
import { createDefaultPreset } from "ts-jest";

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
export default {
  testEnvironment: "jest-environment-jsdom",
  transform: {
    ...tsJestTransformCfg,
  },
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.jest.json", // use the test-specific tsconfig
    },
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};
