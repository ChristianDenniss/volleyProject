# Use official Node.js image - use slim version for smaller image size
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install --no-optional

# Copy the source code
COPY . .

# Compile TypeScript
RUN npm run build

# Expose the application port 
EXPOSE 3000

# Start the application
CMD ["node", "dist/server.js"]
