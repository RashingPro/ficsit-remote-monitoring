import { createDefaultPreset } from "ts-jest";
import { JestConfigWithTsJest, pathsToModuleNameMapper } from "ts-jest";

import { compilerOptions } from "./tsconfig.json";

const tsJestTransformCfg = createDefaultPreset().transform;

export default {
    testEnvironment: "node",
    transform: {
        ...tsJestTransformCfg
    },
    rootDir: "./test",
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>/../" })
} as JestConfigWithTsJest;
