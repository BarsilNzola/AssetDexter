FROM node:18-alpine AS backend

WORKDIR /app/backend
# Copy from packages/backend 
COPY packages/backend/package*.json ./
RUN npm ci --only=production
COPY packages/backend/ ./

FROM node:18-alpine AS frontend

WORKDIR /app/frontend  
# Copy from packages/frontend
COPY packages/frontend/package*.json ./
RUN npm ci
COPY packages/frontend/ ./
RUN npm run build

# Final stage
FROM node:18-alpine

WORKDIR /app

# Copy backend
COPY --from=backend /app/backend ./backend

# Copy frontend dist to backend public directory
COPY --from=frontend /app/frontend/dist ./backend/dist

# Copy ALL packages needed
COPY packages/shared/ ./packages/shared/
COPY packages/contracts/ ./packages/contracts/

WORKDIR /app/backend

EXPOSE 3000

CMD ["node", "dist/index.js"]