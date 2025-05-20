FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install npm and global build dependencies
RUN npm install -g npm@latest && \
    npm install -g drizzle-kit vite

# Install all dependencies (including dev dependencies needed for build)
RUN npm install

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "server/index.js"]