# Real Estate Platform

Monorepo scaffold for the Real Estate Transaction Management Platform.

## Continuous Integration

This repository uses GitHub Actions to run CI on pushes and pull requests to main/master. The CI checks include:

- Install dependencies
- Lint (if configured)
- TypeScript type checking (if applicable)
- Unit tests
- Build (if configured)
- Shell script checks via ShellCheck

The workflow file is .github/workflows/ci.yml and will run automatically on PRs and pushes to the default branch.
