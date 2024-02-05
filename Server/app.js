import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { connectDB } from "./db/db.js";
import { authRouter } from "./routes/auth.routes.js";
import { userRouter } from "./routes/user.routes.js";
import { chatRouter } from "./routes/chat.routes.js";
import { messageRouter } from "./routes/message.routes.js";
//Socket io
import { Server } from "socket.io";
import { createServer } from "http";
import { initializeSocketIO } from "./socket/socket.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 8080;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Socket connections
const io = new Server(httpServer, {
  pingTimeout: 50000,
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

app.set("io", io); // using set method to mount the `io` instance on the app to avoid usage of `global`

// io.on("connection", (socket) => {
//   console.log(`connected to socket.io`);
//   // console.log(socket.handshake);
// });

initializeSocketIO(io);

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/message", messageRouter);

app.use(notFoundHandler);
app.use(errorHandler);

try {
  await connectDB();
  httpServer.listen(port, () => {
    console.log(`listening on port ${port}`);
  });
} catch (error) {
  console.log(error);
}
