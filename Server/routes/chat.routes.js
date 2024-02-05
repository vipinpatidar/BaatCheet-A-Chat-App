import express from "express";
import {
  deleteAChat,
  getAllChats,
  postCreateChat,
  postCreateGroupChat,
  putAddToGroupChat,
  putLeaveGroup,
  putRemoveFromGroupChat,
  putRenameGroup,
} from "../controllers/chat.controller.js";
import { verifyJwt } from "../middlewares/verifyJwt.js";

export const chatRouter = express.Router();

chatRouter.use(verifyJwt);

chatRouter.get("/getChats", getAllChats);
chatRouter.post("/createChat", postCreateChat);

chatRouter.post("/createGroup", postCreateGroupChat);

chatRouter.put("/renameGroup", putRenameGroup);

chatRouter.put("/addToGroup", putAddToGroupChat);
chatRouter.put("/removeFromGroup", putRemoveFromGroupChat);
chatRouter.put("/leaveGroup", putLeaveGroup);

chatRouter.delete("/deleteChat", deleteAChat);
