import express from "express";
import {
  deleteMessage,
  getAllMessages,
  postSendMessage,
} from "../controllers/message.controller.js";
import { verifyJwt } from "../middlewares/verifyJwt.js";
import {
  deleteMessageLimiter,
  sendMessageLimiter,
} from "../middlewares/rateLimit.js";

export const messageRouter = express.Router();

messageRouter.use(verifyJwt);

messageRouter.get("/getMessages/:chatId", getAllMessages);

messageRouter.post("/sendMessage", sendMessageLimiter, postSendMessage);

messageRouter.delete("/deleteMessage", deleteMessageLimiter, deleteMessage);
