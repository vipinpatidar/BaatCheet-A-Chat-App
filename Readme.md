# BaatCheet - Full Stack MERN Chat App

BaatCheet is a full-stack MERN (MongoDB, Express.js, React, Node.js) chat application that allows users to search for other users, text them individually, create groups, and engage in group chats. The frontend is built with Vite React, providing a fast and modern user interface. The app supports features like blocking/unblocking users, message deletion, sending images, and toggling between dark and light modes.

# Live preview

BaatCheet: https://baatcheet-chatapp-vipin.netlify.app

## Features

- User Search: Find and connect with other users.
- Private Chat: Text other users individually.
- Group Chat: Create groups and engage in group conversations.
- Blocking/Unblocking: Users can block/unblock each other.
- Message Deletion: Delete individual messages.
- Admin Actions: Group admins can delete all messages in the group.admin can add or remove group users.
- Image Sharing: Send images in chat.
- Dark/Light Mode: Toggle between dark and light modes.

## Installation

### Using Docker

<details>
<summary><code>Client/Dockerfile</code></summary>

```Dockerfile

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

```

</details>
<details>
<summary><code>Server/Dockerfile</code></summary>

```Dockerfile

ARG NODE_VERSION=20.11.0

FROM node:${NODE_VERSION}-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 3000

# Start the backend server
CMD ["npm", "start"]

```

</details>

#### add a .env file in Client directory with environment variables like

      #VITE_ENDPOINT=http://localhost:3000
      #VITE_CLOUD_NAME=your cloudinary cloud name
      #VITE_UPLOAD_PRESET=your cloudinary upload preset

#### add a .env file in Server directory with environment variables like

      #PORT=3000
      #MONGODB_URL=your mongodb url
      #ACCESS_TOKEN_SECRET=jwt secret key

<details>
<summary><code>docker-compose.yaml</code></summary>

```dockerfile

# specify the version of docker-compose
version: "3.8"

# define the services/containers to be run
services:
  # define the frontend service
  # we can use any name for the service. A standard naming convention is to use "web" for the frontend
  web:
    # we use depends_on to specify that service depends on another service
    # in this case, we specify that the web depends on the Server service
    # this means that the Server service will be started before the web service
    depends_on:
      - server
    # specify the build context for the web service
    # this is the directory where the Dockerfile for the web service is located
    build: ./Client
    # specify the ports to expose for the web service
    # the first number is the port on the host machine
    # the second number is the port inside the container
    ports:
      - 5173:5173
    # specify the environment variables for the web service
    # these environment variables will be available inside the container
    env_file:
      - ./Client/.env

      # add a .env file in the Client directory with environment variables like
         #VITE_ENDPOINT=http://localhost:3000
         #VITE_CLOUD_NAME=your cloudinary cloud name
         #VITE_UPLOAD_PRESET=your cloudinary upload preset

    # this is for docker compose watch mode
    # anything mentioned under develop will be watched for changes by docker compose watch and it will perform the action mentioned
    develop:
      # we specify the files to watch for changes
      watch:
        # it'll watch for changes in package.json and package-lock.json and rebuild the container if there are any changes
        - path: ./Client/package.json
          action: rebuild
        - path: ./Client/package-lock.json
          action: rebuild
        # it'll watch for changes in the Client directory and sync the changes with the container real time
        - path: ./Client
          target: /app
          action: sync

  # define the server service/container
  server:
    # api service depends on the db service so the db service will be started before the server service
    depends_on:
      - db

    # specify the build context for the server service
    build: ./Server

    # specify the ports to expose for the Server service
    # the first number is the port on the host machine
    # the second number is the port inside the container
    ports:
      - 3000:3000

    # specify environment variables for the Server service
    # for demo purposes, we're using a local mongodb instance
    env_file:
      - ./Server/.env

      # add a .env file in the Server directory with environment variables like
         #PORT=3000
         #MONGODB_URL=your mongodb url
         #ACCESS_TOKEN_SECRET=jwt secret key

    # establish docker compose watch mode for the Server service
    develop:
      # specify the files to watch for changes
      watch:
        # it'll watch for changes in package.json and package-lock.json and rebuild the container and image if there are any changes
        - path: ./Server/package.json
          action: rebuild
        - path: ./Server/package-lock.json
          action: rebuild

        # it'll watch for changes in the Server directory and sync the changes with the container real time
        - path: ./Server
          target: /app
          action: sync

  # define the db service
  db:
    # specify the image to use for the db service from docker hub. If we have a custom image, we can specify that in this format
    # In the above two services, we're using the build context to build the image for the service from the Dockerfile so we specify the image as "build: ./frontend" or "build: ./backend".
    # but for the db service, we're using the image from docker hub so we specify the image as "image: mongo:latest"
    # you can find the image name and tag for mongodb from docker hub here: https://hub.docker.com/_/mongo
    image: mongo:latest

    # specify the ports to expose for the db service
    # generally, we do this in Server service using mongodb atlas. But for demo purposes, we're using a local mongodb instance
    # usually, mongodb runs on port 27017. So we're exposing the port 27017 on the host machine and mapping it to the port 27017 inside the container
    ports:
      - 27017:27017

    # specify the volumes to mount for the db service
    # we're mounting the volume named "chatDB" inside the container at /data/db directory
    # this is done so that the data inside the mongodb container is persisted even if the container is stopped
    volumes:
      - chatDB:/data/db

# define the volumes to be used by the services
volumes:
  chatDB:

```

</details>

#### Creating Images and container from .yaml file

1.  Running in watch mode

    docker-compose watch

2.  Without watch mode

    docker-compose up

3.  Stop and Remove containers

    docker-compose down

### Prerequisites

- Node.js and npm installed globally.
- MongoDB instance.

## Backend Setup

1. Clone the repository:
   git clone https://github.com/yourusername/BaatCheet.git
2. Navigate to the backend directory:
   cd BaatCheet/backend
3. Install dependencies:
   npm install
4. Create a .env file in the backend directory and add the following variables:

- MONGODB_URL=your_mongodb_connection_url
- ACCESS_TOKEN_SECRET=your_access_token_secret
- PORT=your_preferred_port_number

5. Start the backend server: npm start

## Frontend Setup

1. Navigate to the frontend directory:
   cd BaatCheet/frontend

2. Install dependencies:
   npm install

3. Create a .env file in the frontend directory and add the following variable:

- VITE_ENDPOINT=http://localhost:your_backend_port

* VITE_CLOUD_NAME=using cloudnearry for image uploading write cloud name

* VITE_UPLOAD_PRESET= write upload preset of cloudnearry

  4.Start the frontend development server: npm run dev

## Usage

- Open your browser and go to http://localhost:your_frontend_port.

- Replace your_frontend_port with the port number specified in the frontend setup.

- Register and log in to BaatCheet.

- Search for users, start private conversations, or create and join groups.

- Explore various features such as blocking users, deleting messages, and sending images.

- Toggle between dark and light modes for a personalized experience.
