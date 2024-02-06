import jwt from "jsonwebtoken";
import { Server, Socket } from "socket.io";
import { User } from "../models/user.model.js";

const mountJoinChatEvent = (socket) => {
  socket.on("joinChatEvent", (chatId) => {
    // joining the room with the chatId will allow specific events to be fired where we don't bother about the users like typing events
    // E.g. When user types we don't want to emit that event to specific participant.
    // We want to just emit that to the chat where the typing is happening
    socket.join(chatId);
    console.log(`User joined the chat or room 🤝. chatId: `, chatId);
  });
};

const mountSendNewMessageEvent = (socket) => {
  socket.on("newMessageEvent", (newMessage) => {
    let chat = newMessage.chat; // which chat or room a message belongs to
    if (!chat.users) return console.log("chat.users not defined"); // if there is no users in chat return

    // console.log(newMessage);
    // if a user sending message then we want to send message to all other users not who is sending it

    chat.users.forEach((user) => {
      if (user._id === newMessage.sender._id) return;
      socket.in(user._id).emit("messageReceived", newMessage);
    });
  });
};

const mountParticipantTypingEvent = (socket) => {
  socket.on("typingEvent", ({ chatId, senderSocketId }) => {
    socket.to(chatId).emit("typingEvent", senderSocketId);
  });
};

const mountParticipantStoppedTypingEvent = (socket) => {
  socket.on("stopTypingEvent", ({ chatId, senderSocketId }) => {
    socket.to(chatId).emit("stopTypingEvent", senderSocketId);
  });
};

const initializeSocketIO = (io) => {
  return io.on("connection", async (socket) => {
    try {
      // parse the cookies from the handshake headers (This is only possible if client has `withCredentials: true`)

      let token = socket.handshake.headers?.authorization; // get the accessToken

      // console.log(token, "token");

      if (!token) {
        // Token is required for the socket to work
        throw new Error("Un-authorized handshake. Token is missing");
      }

      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); // decode the token
      // console.log(decodedToken);

      const user = await User.findById(decodedToken?.userId).select(
        "-password"
      );

      // retrieve the user
      if (!user) {
        throw new Error("Un-authorized handshake. Token is invalid");
      }
      socket.user = user; // mount te user object to the socket

      // console.log(user);

      // We are creating a room with user id so that if user is joined but does not have any active chat going on.
      // still we want to emit some socket events to the user.
      // so that the client can catch the event and show the notifications.
      socket.join(user._id.toString());
      socket.emit("connected"); // emit the connected event so that client is aware
      console.log("User connected 🗼. userId: ", user._id.toString());

      mountJoinChatEvent(socket);
      mountSendNewMessageEvent(socket);
      mountParticipantTypingEvent(socket);
      mountParticipantStoppedTypingEvent(socket);

      socket.on("disconnect", () => {
        console.log("user has disconnected 🚫. userId: " + socket.user?._id);
        if (socket.user?._id) {
          socket.leave(socket.user._id);
        }
      });
    } catch (error) {
      socket.emit(
        "socketError",
        error?.message || "Something went wrong while connecting to the socket."
      );
    }
  });
};

const emitSocketEvent = (req, roomId, event, payload) => {
  req.app.get("io").in(roomId).emit(event, payload);
};

export { initializeSocketIO, emitSocketEvent };
