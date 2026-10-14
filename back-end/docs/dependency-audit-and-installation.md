# Dependency Audit and Installation

## Scope

This audit covers:

- the NestJS backend;
- the React frontend;
- package manifests and pnpm lockfiles;
- source imports relevant to running the applications;
- database, authentication, configuration, and frontend API dependencies.

No dependency was added to introduce Redux or React Redux. Existing Redux packages remain in the frontend because existing source files currently import them.

## Package manager and lockfiles

Both projects use pnpm:

- `back-end/package.json`
- `back-end/pnpm-lock.yaml`
- `react-frontend/package.json`
- `react-frontend/pnpm-lock.yaml`

No `package-lock.json` or `yarn.lock` is present for either project.

## Backend dependencies

### Runtime dependencies

The backend manifest already declares the packages required by its source imports:

- `@nestjs/common`
- `@nestjs/config`
- `@nestjs/core`
- `@nestjs/jwt`
- `@nestjs/mapped-types`
- `@nestjs/mongoose`
- `@nestjs/platform-express`
- `@nestjs/swagger`
- `@nestjs/throttler`
- `bcryptjs`
- `class-transformer`
- `class-validator`
- `helmet`
- `mongoose`
- `reflect-metadata`
- `rxjs`
- `swagger-ui-express`
- `winston`
- `winston-daily-rotate-file`

### Development dependencies

Development-only packages include:

- Nest CLI and schematics;
- Jest, Supertest, and testing adapters;
- TypeScript, ts-node, ts-jest, ts-loader, and tsconfig-paths;
- ESLint and Prettier;
- Node, Express, Jest, bcryptjs, and Swagger type packages.

## Frontend dependencies

The frontend source imports packages already declared in its manifest:

- `react`
- `react-dom`
- `react-router-dom`
- `axios`
- `@base-ui/react`
- `class-variance-authority`
- `cn`
- `lucide-react`
- `react-icons`
- Tailwind and Vite integration packages

Frontend development tooling includes Vite, TypeScript, React type definitions, Babel tooling, and oxlint.

## Missing/stale installation findings

The backend `node_modules` installation was stale compared with its manifest and lockfile. It was missing these declared packages:

- `@nestjs/config`
- `@nestjs/mapped-types`
- `@nestjs/mongoose`
- `@nestjs/throttler`
- `bcryptjs`
- `mongoose`
- `@types/swagger-ui-express`

The stale installation also contained packages not declared by the current backend manifest, including:

- `@nestjs/passport`
- `passport`
- `passport-jwt`
- `cloudinary`
- `ms`
- `uuid`

The frontend installation contained the packages declared by its manifest. No missing frontend package was identified.

## Safe installation commands

Restore the exact versions resolved by the existing lockfiles:

```powershell
cd D:\20_TatkuUnited\back-end
pnpm install --frozen-lockfile

cd D:\20_TatkuUnited\react-frontend
pnpm install --frozen-lockfile
```

These commands:

- use the existing lockfiles;
- avoid major-version upgrades;
- do not add speculative packages;
- reconcile stale `node_modules` contents with the manifests.

The backend install may display pnpm's ignored optional build-script warning for `@scarf/scarf`. This is a pnpm supply-chain policy warning and is not a missing application dependency.

## React API dependency choice

The React frontend already has `axios`, but `fetch` is also built into the browser. Either is sufficient for the providers API.

For a small feature, normal React state plus `fetch` is enough:

- `useState()` stores providers;
- `useEffect()` loads them;
- `fetch()` sends HTTP requests;
- the component renders the state.

No new state-management package is required.

## Validation notes

The frontend build reaches TypeScript checking but currently reports pre-existing issues, including:

- unresolved `@/` alias imports;
- existing Redux-related type errors;
- unused imports;
- nullable state handling;
- implicit `any` parameters.

These are separate from the providers API dependency setup.
