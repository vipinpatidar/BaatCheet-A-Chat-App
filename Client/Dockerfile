ARG NODE_VERSION=20.11.0

# Use the official Node.js 20-alpine as a base image
FROM node:${NODE_VERSION}-alpine

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json to take advantage of caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Vite app for production
# RUN npm run build

# Expose the port that Vite will use
EXPOSE 5173

# Start the Vite development server
CMD ["npm", "run", "dev"]