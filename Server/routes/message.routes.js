import express from "express";
import {
  deleteMessage,
  getAllMessages,
  postSendMessage,
} from "../controllers/message.controller.js";
import { verifyJwt } from "../middlewares/verifyJwt.js";

export const messageRouter = express.Router();

messageRouter.use(verifyJwt);

messageRouter.get("/getMessages/:chatId", getAllMessages);

messageRouter.post("/sendMessage", postSendMessage);

messageRouter.delete("/deleteMessage", deleteMessage);
