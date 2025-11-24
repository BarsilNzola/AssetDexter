FROM node:18-alpine AS backend

WORKDIR /app
COPY package*.json ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json ./packages/shared/
COPY packages/contracts/package.json ./packages/contracts/

# Install all dependencies at root level first
RUN npm ci --only=production --workspace=packages/backend --workspace=packages/shared --workspace=packages/contracts

# Copy backend source
COPY packages/backend/ ./packages/backend/
COPY packages/shared/ ./packages/shared/ 
COPY packages/contracts/ ./packages/contracts/

WORKDIR /app/packages/backend
RUN npm run build

FROM node:18-alpine AS frontend

WORKDIR /app
COPY package*.json ./
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/shared/package.json ./packages/shared/

# Install frontend dependencies
RUN npm ci --workspace=packages/frontend --workspace=packages/shared

# Copy frontend source
COPY packages/frontend/ ./packages/frontend/
COPY packages/shared/ ./packages/shared/

WORKDIR /app/packages/frontend
RUN npm run build

# Final stage
FROM node:18-alpine

WORKDIR /app

# Copy backend
COPY --from=backend /app/packages/backend/dist ./backend/dist
COPY --from=backend /app/packages/backend/package.json ./backend/
COPY --from=backend /app/node_modules ./node_modules

# Copy frontend build
COPY --from=frontend /app/packages/frontend/dist ./backend/dist

# Copy shared packages
COPY --from=backend /app/packages/shared ./packages/shared/
COPY --from=backend /app/packages/contracts ./packages/contracts/

WORKDIR /app/backend

EXPOSE 3000

CMD ["node", "dist/index.js"]