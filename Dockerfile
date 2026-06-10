FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the application code
COPY . .

# Expose backend port
EXPOSE 5000

# Start production server by default
CMD ["node", "server.js"]
