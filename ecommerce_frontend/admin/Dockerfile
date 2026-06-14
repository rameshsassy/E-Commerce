FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the application code
COPY . .

# Expose frontend dev server port
EXPOSE 5175

# Start development server with host mapping
CMD ["npm", "run", "dev", "--", "--host"]
