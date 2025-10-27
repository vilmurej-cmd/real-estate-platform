#!/usr/bin/env bash
# Creates branch feat/bootstrap-full, writes files, commits, pushes, and opens a PR.
# Usage:
#   chmod +x scripts/create_pr.sh
#   ./scripts/create_pr.sh /path/to/local/repo
#
# Prereqs:
# - git installed & configured
# - gh (GitHub CLI) installed & authenticated with permission to push & create PRs
# - You have write permission to vilmurej-cmd/real-estate-platform

set -euo pipefail

ROOT="${1:-$(pwd)}"
REPO_DIR="$ROOT"
BRANCH="feat/bootstrap-full"
COMMIT_MSG="feat(api): add Auth0 middleware, role middleware, routes, prisma schema, docker-compose"
PR_TITLE="$COMMIT_MSG"
PR_BODY="Adds Auth0 JWKS middleware, role middleware, clients/transactions/documents route skeletons, full Prisma schema and docker-compose for local dev."

echo "Using repo path: $REPO_DIR"
cd "$REPO_DIR"

# Ensure we're on main and up-to-date
git fetch origin
git checkout -B "$BRANCH" origin/main || git checkout -b "$BRANCH"

# Create directories
mkdir -p apps/api/src/middleware apps/api/src/routes apps/api/prisma apps/web/src/pages packages/shared

# apps/api/src/middleware/auth0.middleware.ts
cat > apps/api/src/middleware/auth0.middleware.ts <<'EOF'
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtHeader, SigningKeyCallback } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

export interface AuthRequest extends Request {
  user?: any;
}

const AUTH0_DOMAIN = process.env.NEXT_PUBLIC_AUTH0_DOMAIN || process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || process.env.AUTH0_AUDIENCE;

if (!AUTH0_DOMAIN || !AUTH0_AUDIENCE) {
  console.warn('Auth0 middleware: AUTH0_DOMAIN or AUTH0_AUDIENCE is not set. JWT verification will fail until configured.');
}

const client = jwksClient({
  jwksUri: \`https://\${AUTH0_DOMAIN}/.well-known/jwks.json\`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 10 * 60 * 1000
});

function getKey(header: JwtHeader, callback: SigningKeyCallback) {
  if (!header.kid) {
    return callback(new Error('Missing kid in token header'));
  }
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = (key as any).getPublicKey ? (key as any).getPublicKey() : (key as any).rsaPublicKey;
    callback(null, signingKey);
  });
}

export const authenticateAuth0 = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decodedHeader = jwt.decode(token, { complete: true }) as { header?: JwtHeader } | null;
  const header = decodedHeader?.header;
  if (!header) {
    return res.status(400).json({ error: 'Invalid token format' });
  }

  getKey(header, (err, key) => {
    if (err) {
      console.error('JWKS key retrieval error', err);
      return res.status(500).json({ error: 'Unable to retrieve signing key' });
    }

    const verifyOptions: jwt.VerifyOptions = {
      issuer: AUTH0_DOMAIN ? \`https://\${AUTH0_DOMAIN}/\` : undefined,
      audience: AUTH0_AUDIENCE || undefined,
      algorithms: ['RS256']
    };

    try {
      const payload = jwt.verify(token, key as jwt.Secret, verifyOptions);
      req.user = payload;
      return next();
    } catch (verifyErr: any) {
      console.error('JWT verification failed', verifyErr);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
  });
};
EOF

# apps/api/src/middleware/role.middleware.ts
cat > apps/api/src/middleware/role.middleware.ts <<'EOF'
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth0.middleware';

export const requireRole = (allowed: string | string[]) => {
  const allowedRoles = Array.isArray(allowed) ? allowed : [allowed];
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const role = (user as any).role || (user as any)['https://your-app.example.com/roles'];
    if (!role) return res.status(403).json({ error: 'Role not present in token' });
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Insufficient role' });
    }
    return next();
  };
};
EOF

# apps/api/src/routes/clients.routes.ts
cat > apps/api/src/routes/clients.routes.ts <<'EOF'
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAuth0 } from '../middleware/auth0.middleware';
import { requireRole } from '../middleware/role.middleware';

const prisma = new PrismaClient();
const router = Router();

router.get('/', authenticateAuth0, async (req, res, next) => {
  try {
    const userId = (req as any).user?.sub;
    const clients = await prisma.client.findMany({
      where: { userId: userId },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(clients);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticateAuth0, requireRole(['agent', 'admin']), async (req, res, next) => {
  try {
    const userId = (req as any).user?.sub;
    const payload = req.body;
    const created = await prisma.client.create({
      data: { ...payload, userId }
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticateAuth0, async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (err) {
    next(err);
  }
});

export default router;
EOF

# apps/api/src/routes/transactions.routes.ts
cat > apps/api/src/routes/transactions.routes.ts <<'EOF'
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAuth0 } from '../middleware/auth0.middleware';
import { requireRole } from '../middleware/role.middleware';

const prisma = new PrismaClient();
const router = Router();

router.get('/', authenticateAuth0, async (req, res, next) => {
  try {
    const userId = (req as any).user?.sub;
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(transactions);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticateAuth0, requireRole(['agent', 'admin']), async (req, res, next) => {
  try {
    const userId = (req as any).user?.sub;
    const payload = req.body;
    const created = await prisma.transaction.create({
      data: {
        ...payload,
        userId
      }
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

export default router;
EOF

# apps/api/src/routes/documents.routes.ts
cat > apps/api/src/routes/documents.routes.ts <<'EOF'
import { Router } from 'express';
import { authenticateAuth0 } from '../middleware/auth0.middleware';
import { getPresignedUploadUrl } from '../services/s3.service';

const router = Router();

router.post('/presign', authenticateAuth0, async (req, res, next) => {
  try {
    const { filename, contentType } = req.body;
    if (!filename || !contentType) return res.status(400).json({ error: 'filename and contentType required' });
    const { url, key } = await getPresignedUploadUrl(filename, contentType);
    res.json({ url, key });
  } catch (err) {
    next(err);
  }
});

export default router;
EOF

# apps/api/package.json
cat > apps/api/package.json <<'EOF'
{
  "name": "real-estate-api",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc -p .",
    "start": "node dist/index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "seed": "ts-node prisma/seed.ts"
  },
  "dependencies": {
    "@aws-sdk/client-s3": "^3.400.0",
    "@aws-sdk/s3-request-presigner": "^3.400.0",
    "@prisma/client": "^5.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.2",
    "helmet": "^6.0.1",
    "jsonwebtoken": "^9.0.0",
    "jwks-rsa": "^2.1.4",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "prisma": "^5.0.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/jsonwebtoken": "^9.0.2",
    "@types/node": "^20.0.0",
    "ts-node": "^10.9.1",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.0.0"
  }
}
EOF

# apps/api/tsconfig.json
cat > apps/api/tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src", "prisma"]
}
EOF

# apps/api/prisma/schema.prisma (truncated if already exists, but full content here)
cat > apps/api/prisma/schema.prisma <<'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              String    @id @default(uuid())
  email           String    @unique
  passwordHash    String?
  firstName       String
  lastName        String
  phone           String?
  role            String    @default("agent")
  brokerageId     String?
  mfaEnabled      Boolean   @default(false)
  preferences     Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  clients         Client[]
  transactions    Transaction[]
  documents       Document[]
  appointments    Appointment[]
  messages        Message[]
  messageTemplates MessageTemplate[]
  @@map("users")
}

model Client {
  id              String    @id @default(uuid())
  userId          String
  type            String
  stage           String    @default("lead")
  status          String    @default("warm")
  leadScore       Int?      @default(0)
  source          String?
  firstName       String
  lastName        String
  email           String
  phone           String?
  preferences     Json?
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  buyerTransactions  Transaction[] @relation("BuyerClient")
  sellerTransactions Transaction[] @relation("SellerClient")
  timeline        ClientTimeline[]
  appointments    Appointment[]
  documents       Document[]
  messages        Message[]
  @@map("clients")
}

model Transaction {
  id              String    @id @default(uuid())
  userId          String
  buyerClientId   String?
  sellerClientId  String?
  transactionType String
  status          String    @default("pending")
  propertyAddress Json
  listPrice       Decimal?
  finalPrice      Decimal?
  contractDate    DateTime?
  closingDate     DateTime?
  commissionEarned Decimal?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  buyerClient     Client?   @relation("BuyerClient", fields: [buyerClientId], references: [id])
  sellerClient    Client?   @relation("SellerClient", fields: [sellerClientId], references: [id])
  milestones      Milestone[]
  parties         TransactionParty[]
  timeline        TransactionTimeline[]
  documents       Document[]
  appointments    Appointment[]
  messages        Message[]
  @@map("transactions")
}

model Milestone {
  id              String    @id @default(uuid())
  transactionId   String
  milestoneType   String
  name            String
  dueDate         DateTime?
  completedDate   DateTime?
  status          String    @default("pending")
  responsibleParty String?
  createdAt       DateTime  @default(now())
  transaction     Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  @@map("milestones")
}

model TransactionParty {
  id              String    @id @default(uuid())
  transactionId   String
  partyType       String
  companyName     String?
  contactName     String
  email           String?
  phone           String?
  createdAt       DateTime  @default(now())
  transaction     Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  @@map("transaction_parties")
}

model Document {
  id              String    @id @default(uuid())
  userId          String
  transactionId   String?
  clientId        String?
  category        String
  documentType    String?
  filename        String
  storagePath     String
  fileSize        Int?
  aiProcessed     Boolean   @default(false)
  aiExtractedData Json?
  status          String    @default("active")
  createdAt       DateTime  @default(now())
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  transaction     Transaction? @relation(fields: [transactionId], references: [id])
  client          Client?   @relation(fields: [clientId], references: [id])
  @@map("documents")
}

model Appointment {
  id              String    @id @default(uuid())
  userId          String
  clientId        String?
  transactionId   String?
  appointmentType String
  title           String
  location        Json?
  startTime       DateTime
  endTime         DateTime
  status          String    @default("scheduled")
  notes           String?
  createdAt       DateTime  @default(now())
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  client          Client?   @relation(fields: [clientId], references: [id])
  transaction     Transaction? @relation(fields: [transactionId], references: [id])
  @@map("appointments")
}

model Message {
  id              String    @id @default(uuid())
  userId          String
  clientId        String?
  transactionId   String?
  messageType     String
  direction       String
  subject         String?
  body            String
  status          String    @default("sent")
  openedAt        DateTime?
  createdAt       DateTime  @default(now())
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  client          Client?   @relation(fields: [clientId], references: [id])
  transaction     Transaction? @relation(fields: [transactionId], references: [id])
  @@map("messages")
}

model MessageTemplate {
  id              String    @id @default(uuid())
  userId          String
  name            String
  category        String
  subject         String?
  body            String
  variables       Json?
  usageCount      Int       @default(0)
  createdAt       DateTime  @default(now())
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("message_templates")
}

model ClientTimeline {
  id              String    @id @default(uuid())
  clientId        String
  eventType       String
  eventDate       DateTime  @default(now())
  summary         String
  details         Json?
  createdBy       String
  client          Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)
  @@map("client_timeline")
}

model TransactionTimeline {
  id              String    @id @default(uuid())
  transactionId   String
  eventType       String
  eventDate       DateTime  @default(now())
  summary         String
  details         Json?
  createdBy       String
  transaction     Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  @@map("transaction_timeline")
}
EOF

# docker-compose.yml at repo root
cat > docker-compose.yml <<'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15
    restart: unless-stopped
    environment:
      POSTGRES_USER: realestate
      POSTGRES_PASSWORD: realestate
      POSTGRES_DB: realestate_db
    volumes:
      - db_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    restart: unless-stopped
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  adminer:
    image: adminer
    restart: unless-stopped
    ports:
      - "8080:8080"

volumes:
  db_data:
  redis_data:
EOF

# Stage, commit, push
git add -A
git commit -m "$COMMIT_MSG" || echo "No changes to commit"
git push -u origin "$BRANCH"

# Create PR using gh
if command -v gh >/dev/null 2>&1; then
  echo "Creating PR using gh..."
  gh pr create --title "$PR_TITLE" --body "$PR_BODY" --base main
  echo "PR created."
else
  echo "gh (GitHub CLI) not found. Please install & authenticate gh, or open a PR in the GitHub UI from branch $BRANCH."
fi

echo "Done. Branch: $BRANCH"
EOF
