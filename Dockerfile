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

# DEBUG: Check what the backend build actually produced
RUN echo "=== Backend dist structure ==="
RUN find /app/packages/backend/dist -type f -name "*.js" | head -20
RUN echo "=== Backend package.json main entry ==="
RUN cat /app/packages/backend/package.json | grep main

# Build frontend
WORKDIR /app/packages/frontend
RUN npm run build

# Final stage
FROM node:18-alpine

WORKDIR /app

# Copy built backend
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

# DEBUG: Check final structure
RUN echo "=== Final app structure ==="
RUN find /app -name "*.js" -type f | grep -E "(index|server|main)" | head -10
RUN ls -la /app/

EXPOSE 3000

CMD ["node", "dist/index.js"]