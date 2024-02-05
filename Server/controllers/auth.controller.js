import asyncHandler from "express-async-handler";
import { User } from "../models/user.model.js";

const expirationDate = new Date();
expirationDate.setDate(expirationDate.getDate() + 1);

/*=================== SIGN UP ==================== */

export const postSignUpUser = asyncHandler(async (req, res, next) => {
  const { name, status, image, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(422);
    throw new Error("Please check and enter all required fields");
  }

  const user = await User.findOne({ email: email });

  if (user) {
    res.status(422);
    throw new Error(
      "This email address is already exists. Please use other email addresses."
    );
  }

  let createData;

  console.log(image);

  if (image) {
    createData = {
      name,
      email,
      password,
      image,
      status,
    };
  } else {
    createData = {
      name,
      email,
      password,
      status,
    };
  }

  const newUser = await User.create(createData);

  const token = newUser.generateAccessToken();

  if (newUser) {
    res
      .cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        expires: expirationDate,
      })
      .status(200)
      .json({
        userId: newUser._id,
        token: token,
      });
  } else {
    throw new Error("Failed to create user. Try again.");
  }
});

/*=================== LOGIN ==================== */

export const postLoginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(422);
    throw new Error("Please check and enter all required fields");
  }

  const user = await User.findOne({ email: email });

  if (!user) {
    res.status(401);
    throw new Error(
      "User not found. Please enter a valid email and Password or Sign Up first."
    );
  }

  const isMatched = await user.isPasswordCorrect(password);

  if (!isMatched) {
    res.status(404);
    throw new Error("Please enter a valid password.");
  }

  const token = user.generateAccessToken();

  if (user) {
    res
      .cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        expires: expirationDate,
      })
      .status(200)
      .json({
        userId: user._id,
        token: token,
      });
  } else {
    throw new Error("Failed to login. Please Try again.");
  }
});
