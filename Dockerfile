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

# Copy ALL config files first
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/backend/tsconfig.json ./packages/backend/
COPY packages/frontend/ ./packages/frontend/

# Debug: Check if tsconfig files exist
RUN echo "=== Checking tsconfig files ===" && \
    ls -la packages/backend/tsconfig.json && \
    cat packages/backend/tsconfig.json

# Build shared package first
COPY packages/shared/ ./packages/shared/
WORKDIR /app/packages/shared
RUN npm run build

# Build backend
COPY packages/backend/ ./packages/backend/
COPY packages/contracts/ ./packages/contracts/
WORKDIR /app/packages/backend

# Debug: Verify files before build
RUN echo "=== Backend files before build ===" && \
    ls -la && \
    ls -la src/ && \
    find . -name "*.ts" | head -10

RUN npm run build

# Build frontend
WORKDIR /app/packages/frontend
RUN npm run build

# Final stage
FROM node:18-alpine

WORKDIR /app

# Copy built backend
COPY --from=base /app/packages/backend/dist ./backend/dist
COPY --from=base /app/packages/backend/package.json ./backend/

# Copy built frontend to backend public directory
COPY --from=base /app/packages/frontend/dist ./backend/dist

# Copy built shared package
COPY --from=base /app/packages/shared/dist ./packages/shared/dist
COPY --from=base /app/packages/shared/package.json ./packages/shared/

# Copy contracts
COPY --from=base /app/packages/contracts ./packages/contracts/

# Copy production node_modules
COPY --from=base /app/node_modules ./node_modules

WORKDIR /app/backend

EXPOSE 3000

CMD ["node", "dist/index.js"]