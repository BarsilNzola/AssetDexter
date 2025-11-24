FROM node:18-alpine AS backend

WORKDIR /app/backend
COPY packages/backend/package*.json ./
RUN npm ci --only=production
COPY packages/backend/ ./

FROM node:18-alpine AS frontend

WORKDIR /app/frontend  
COPY packages/frontend/package*.json ./
RUN npm ci
COPY packages/frontend/ ./
RUN npm run build

# Final stage
FROM node:18-alpine

WORKDIR /app

# Copy backend
COPY --from=backend /app/backend ./backend

# Copy frontend build to backend public directory
COPY --from=frontend /app/frontend/dist ./backend/dist

# Copy ALL packages needed (shared, contracts, etc.)
COPY packages/shared/ ./packages/shared/
COPY packages/contracts/ ./packages/contracts/

# Copy root package files for shared dependencies
COPY package*.json ./
COPY turbo.json ./

WORKDIR /app/backend

EXPOSE 3000

CMD ["node", "dist/index.js"]  # Using the regular index.ts, no server.prod.ts needed