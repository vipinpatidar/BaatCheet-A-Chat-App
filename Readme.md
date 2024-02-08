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
