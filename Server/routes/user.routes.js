import express from "express";
import {
  getAllUsers,
  getOneUser,
  postBlockUser,
  postUnblockUser,
  putUpdateUserProfile,
} from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/verifyJwt.js";

export const userRouter = express.Router();

userRouter.use(verifyJwt);

userRouter.get("/allUsers", getAllUsers);

userRouter.get("/:userId", getOneUser);

userRouter.put("/updateProfile", putUpdateUserProfile);

userRouter.post("/blockUser", postBlockUser);
userRouter.post("/unblockUser", postUnblockUser);
