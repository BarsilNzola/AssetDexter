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

# Build shared package first (since backend depends on it)
COPY packages/shared/ ./packages/shared/
WORKDIR /app/packages/shared
RUN npm run build

# Build backend
COPY packages/backend/ ./packages/backend/
COPY packages/contracts/ ./packages/contracts/
WORKDIR /app/packages/backend
RUN npm run build

# Build frontend
COPY packages/frontend/ ./packages/frontend/
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