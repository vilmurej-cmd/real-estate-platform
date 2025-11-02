# Real Estate Platform

Monorepo scaffold for the Real Estate Transaction Management Platform.

## Continuous Integration

CI automatically runs on all pushes and pull requests to `main`/`master` branches. The CI workflow performs the following checks:

- **Linting**: Runs code linting (if configured)
- **Type Checking**: Runs TypeScript type checking
- **Unit Tests**: Runs the test suite
- **Build**: Builds the project
- **Shell Script Validation**: Runs ShellCheck on all `.sh` files
