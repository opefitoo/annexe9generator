# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Build argument for API URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build for production
RUN npm run build

# Production stage - use serve
FROM node:20-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built assets
COPY --from=build /app/dist ./dist

# Expose port
EXPOSE 3000

# Serve the app
CMD ["serve", "-s", "dist", "-l", "3000"]
