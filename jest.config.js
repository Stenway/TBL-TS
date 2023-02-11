/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/tests/', '<rootDir>/src/'],
	collectCoverage: true,
	collectCoverageFrom: ['src/tbl.ts']
};