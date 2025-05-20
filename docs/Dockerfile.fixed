FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

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