import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";

export const verifyJwt = async (req, res, next) => {
  try {
    const token =
      req.header("Authorization")?.replace("Bearer ", "") ||
      req.cookies?.accessToken;

    if (!token) {
      res.status(403);
      throw new Error("Unauthorized action");
    }

    const decoded = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decoded) {
      res.status(403);
      throw new Error("Unauthorized action");
    }
    // console.log(decoded);
    req.userId = decoded.userId;

    next();
  } catch (error) {
    next(error);
  }
};
