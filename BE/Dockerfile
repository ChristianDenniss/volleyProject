# Use official Node.js v20 image with security updates
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json ./

# Install all dependencies (including dev) for building
RUN npm ci && npm cache clean --force

# Copy the source code
COPY . .

# Verify and prepare start script
RUN echo "Verifying start script..." && \
    ls -la start.sh && \
    cat start.sh && \
    sed -i 's/\r$//' start.sh && \
    chmod +x start.sh && \
    echo "Script permissions:" && \
    ls -la start.sh

# Build the application
RUN npm run build

# Expose the application port 
EXPOSE 3000

# Set NODE_ENV to production
ENV NODE_ENV=production

# Start the application in production mode
ENTRYPOINT ["./start.sh"]
