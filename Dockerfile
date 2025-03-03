# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the source code
COPY . .

# Compile TypeScript
RUN npm run build

# Expose the application port
EXPOSE 5000

# Start the application
CMD ["node", "dist/index.js"]
