FROM node:18-slim

WORKDIR /app

# Install necessary build tools
RUN apt-get update && apt-get install -y python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]