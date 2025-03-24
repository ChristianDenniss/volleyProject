# Use official Node.js v20 image - use slim version for smaller image size
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json ./

# For production, use:
# RUN npm ci --omit=dev && npm cache clean --force
# For development (keeping dev dependencies for ts-node):
RUN npm ci && npm cache clean --force

# Copy the source code
COPY . .

# Expose the application port 
EXPOSE 3000

# Development mode with ts-node
CMD ["npm", "run", "dev"]

# For production, uncomment below and comment the dev CMD above:
# RUN npm run build
# CMD ["npm", "run", "start:prod"]
