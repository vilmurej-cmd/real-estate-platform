# GitHub Copilot Instructions for Real Estate Platform

## Project Overview

This is a **Real Estate Transaction Management Platform** built as a monorepo with the following structure:

- **`apps/api`**: Backend REST API service built with Node.js, Express, and Prisma
- **`apps/web`**: Frontend web application (placeholder)
- **`packages/shared`**: Shared code and types across applications

## Tech Stack & Key Technologies

### Backend (apps/api)
- **Language**: TypeScript 5.x with strict mode enabled
- **Runtime**: Node.js 20.x
- **Framework**: Express.js 4.x
- **ORM**: Prisma 5.x with PostgreSQL
- **Authentication**: Auth0 with JWT and JWKS
- **Storage**: AWS S3 for file uploads
- **Validation**: Zod for runtime type validation
- **Testing**: Jest with ts-jest and Supertest
- **Security**: Helmet for HTTP headers, CORS configured

### Frontend (apps/web)
- Currently a placeholder for future development

## Coding Standards

### TypeScript Guidelines

1. **Always use TypeScript** for all new files (`.ts` extension for Node, `.tsx` for React when implemented)
2. **Strict mode is enabled** - ensure all types are properly defined
3. **Use explicit types** for function parameters and return values
4. **Avoid `any` type** - use `unknown` or proper types instead
5. **Use interfaces for object shapes** and types for unions/intersections
6. **Type guards and validation**: Use Zod schemas for runtime validation at API boundaries

### Code Organization

1. **Follow existing folder structure**:
   - `src/routes/` - Express route handlers
   - `src/middleware/` - Express middleware (auth, validation, etc.)
   - `src/lib/` - Shared utilities and configurations
   - `src/validators/` - Zod schemas for validation
   - `src/types/` - TypeScript type definitions
   - `tests/` - Jest test files

2. **File naming conventions**:
   - Use kebab-case for file names: `clients.routes.ts`, `auth0.middleware.ts`
   - Test files: `*.test.ts` or `*.spec.ts`
   - Type definitions: `*.d.ts`

3. **Module exports**:
   - Use default exports for main route handlers and middleware
   - Use named exports for utilities and helper functions

### API Development

1. **RESTful conventions**:
   - Use proper HTTP methods (GET, POST, PUT, PATCH, DELETE)
   - Use meaningful endpoint names
   - Return appropriate HTTP status codes

2. **Request validation**:
   - All incoming data must be validated using Zod schemas
   - Use middleware for validation when possible
   - Return 400 Bad Request with clear error messages for validation failures

3. **Authentication & Authorization**:
   - Use the existing Auth0 middleware for protected routes
   - Always verify JWT tokens before accessing protected resources
   - Store user context in `req.user` after authentication

4. **Error handling**:
   - Use try-catch blocks for async operations
   - Return appropriate error responses with meaningful messages
   - Log errors appropriately (using morgan or similar)

5. **Database interactions**:
   - Use Prisma client for all database operations
   - Import from `src/lib/prisma` (shared Prisma instance)
   - Use transactions for operations that modify multiple records
   - Apply pagination for list endpoints

### Testing Standards

1. **Test coverage**:
   - Write tests for all new API endpoints
   - Write tests for middleware and utility functions
   - Mock external dependencies (Prisma, Auth0, AWS S3)

2. **Test structure**:
   - Use `describe` blocks to group related tests
   - Use clear, descriptive test names
   - Follow Arrange-Act-Assert pattern

3. **Mocking**:
   - Mock Prisma client using Jest mocks (see existing tests)
   - Mock Auth0 middleware for authenticated endpoints
   - Mock AWS S3 SDK for file upload tests

4. **Running tests**:
   - Run `npm test` in the `apps/api` directory
   - Tests run in band with `--runInBand --detectOpenHandles`
   - Use `npm run test:watch` for development

### Security Best Practices

1. **Never commit secrets** - use environment variables (`.env` file)
2. **Validate all input** - use Zod schemas to prevent injection attacks
3. **Use parameterized queries** - Prisma handles this automatically
4. **Sanitize file uploads** - validate file types and sizes
5. **Apply rate limiting** for public endpoints (when implemented)
6. **Use HTTPS in production** and secure cookies
7. **Keep dependencies updated** - regularly check for security updates

### Dependencies Management

1. **Adding dependencies**:
   - Run `npm install <package>` in the appropriate workspace directory
   - Document why the dependency is needed
   - Prefer well-maintained packages with active communities

2. **Updating dependencies**:
   - Test thoroughly after updates
   - Check for breaking changes in changelogs
   - Update lockfiles (`package-lock.json`)

### Environment & Configuration

1. **Environment variables**:
   - Required variables should be documented in `.env.example`
   - Use `dotenv` to load environment variables
   - Never commit `.env` or `.env.local` files

2. **Database migrations**:
   - Use Prisma migrations: `npm run prisma:migrate`
   - Generate Prisma client after schema changes: `npm run prisma:generate`

## Build & Development Workflow

### Development
```bash
cd apps/api
npm run dev  # Starts ts-node-dev with hot reload
```

### Building
```bash
cd apps/api
npm run build  # Compiles TypeScript to dist/
```

### Testing
```bash
cd apps/api
npm test  # Run all tests
npm run test:watch  # Watch mode for development
```

### CI/CD
- Tests run automatically on PRs via GitHub Actions
- Workflow file: `.github/workflows/ci-tests.yml`
- Uses Node.js 20 and npm ci for consistent builds

## Common Patterns

### Creating a new API endpoint

1. Define Zod schema in `src/validators/zodSchemas.ts`
2. Create route handler in `src/routes/`
3. Add authentication middleware if needed
4. Implement Prisma database operations
5. Write tests in `tests/`

### Example route structure:
```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth0.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { mySchema } from '../validators/zodSchemas';
import prisma from '../lib/prisma';

const router = Router();

router.post('/', authenticate, validateRequest(mySchema), async (req, res) => {
  try {
    // Implementation
    res.status(201).json({ data: result });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

## Additional Notes

- This is a monorepo, but currently only the API is actively developed
- Follow the principle of least privilege for all operations
- Write self-documenting code with clear variable and function names
- Add comments only when the "why" isn't obvious from the code
- Keep functions small and focused on a single responsibility
- Use async/await instead of callbacks or raw promises
