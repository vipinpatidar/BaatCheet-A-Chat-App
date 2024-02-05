import express from "express";
import {
  postLoginUser,
  postSignUpUser,
} from "../controllers/auth.controller.js";

export const authRouter = express.Router();

authRouter.post("/signup", postSignUpUser);
authRouter.post("/login", postLoginUser);
