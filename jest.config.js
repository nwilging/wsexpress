module.exports = {
    "roots": [
        "<rootDir>/tests",
        "<rootDir>/src",
    ],
    "coverageReporters": ["lcov", "json-summary"],
    "collectCoverageFrom": [
        "src/**/*.ts",
    ],
    "testMatch": [
        "**/__tests__/**/*.+(ts|tsx|js)",
        "**/?(*.)+(spec|test).+(ts|tsx|js)",
    ],
    "transform": {
        "^.+\\.(ts|tsx)$": "ts-jest",
    },
};
