# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
# Install dependencies and rebuild bcrypt for the current platform
RUN npm install
RUN npm rebuild bcrypt --build-from-source

# Copy the source code
COPY . .

# Compile TypeScript
RUN npm run build

# Expose the application port (will be overridden by docker-compose PORT mapping)
EXPOSE 3000

# Start the application
CMD ["node", "dist/server.js"]
