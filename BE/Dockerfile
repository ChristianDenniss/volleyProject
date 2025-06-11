# Use official Node.js v20 image - use slim version for smaller image size
FROM node:23-slim

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy the source code
COPY . .

# Build the application
RUN npm run build

# Expose the application port 
EXPOSE 3000

# Set NODE_ENV to production
ENV NODE_ENV=production

# Start the application in production mode
CMD ["npm", "run", "start:prod"]
