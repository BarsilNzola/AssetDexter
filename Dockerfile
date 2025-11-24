FROM node:18-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/

# Install all dependencies
RUN npm ci

# Copy ALL source code
COPY packages/shared/ ./packages/shared/
COPY packages/backend/ ./packages/backend/
COPY packages/frontend/ ./packages/frontend/
COPY packages/contracts/artifacts/contracts ./packages/contracts/artifacts/contracts

# Build shared package first
WORKDIR /app/packages/shared
RUN npm run build

# Build backend
WORKDIR /app/packages/backend
RUN npm run build

# Build frontend
WORKDIR /app/packages/frontend
RUN npm run build

# Debug: Check if backend dist exists
RUN ls -la /app/packages/backend/dist/

# Final stage
FROM node:18-alpine

WORKDIR /app

# Copy built backend (FIXED PATH)
COPY --from=base /app/packages/backend/dist ./dist
COPY --from=base /app/packages/backend/package.json ./

# Copy built frontend to serve as static files
COPY --from=base /app/packages/frontend/dist ./public

# Copy built shared package
COPY --from=base /app/packages/shared/dist ./packages/shared/dist
COPY --from=base /app/packages/shared/package.json ./packages/shared/

# Copy contracts
COPY --from=base /app/packages/contracts ./packages/contracts/

# Copy production node_modules
COPY --from=base /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/index.js"]