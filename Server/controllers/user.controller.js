import asyncHandler from "express-async-handler";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

/*=================== GET ONE USER ==================== */

export const getOneUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  const result = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $project: {
        password: 0,
      },
    },
  ]);

  // console.log(result);

  const user = result[0];

  res.status(200).json(user);
});

/*=================== GET ALL USER ==================== */

export const getAllUsers = asyncHandler(async (req, res, next) => {
  const { search } = req.query;

  if (!search) {
    res.status(400);
    throw new Error("Please enter a name or email to search.");
  }

  const users = await User.aggregate([
    {
      $match: {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      },
    },
    {
      $match: {
        _id: {
          $ne: new mongoose.Types.ObjectId(req.userId),
        },
      },
    },

    {
      $project: {
        password: 0,
      },
    },
  ]);

  res.status(200).json(users);
});

/*=================== UPDATE USER PROFILE ==================== */

export const putUpdateUserProfile = asyncHandler(async (req, res, next) => {
  try {
    const { name, image, status, password } = req.body;
    const loggedInUserId = req.userId;

    if (name.length === 0) {
      res.status(401);
      throw new Error("please provide a user name.");
    }

    const user = await User.findById(loggedInUserId);

    if (password !== "") {
      user.password = password;
      await user.save();
    }

    user.name = name;
    user.image = image;
    user.status = status;

    const newUser = await user.save();
    // console.log(newUser);
    res.status(200).json(newUser);
  } catch (error) {
    next(error);
  }
});

/*=================== BLOCK USER ==================== */

export const postBlockUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.body;
  const loggedInUserId = req.userId;

  const blocker = await User.findById(loggedInUserId);

  if (!userId) {
    res.status(404);
    throw new Error("please provide a user to block.");
  }

  if (userId.toString() === loggedInUserId.toString()) {
    res.status(422);
    throw new Error("you can not block/unblock yourself.");
  }

  if (blocker.blockedUsers.includes(userId)) {
    res.status(422);
    throw new Error("This user is already blocked.");
  }

  const user = await User.findByIdAndUpdate(
    loggedInUserId,
    {
      $addToSet: { blockedUsers: userId },
    },
    { new: true }
  );

  // console.log(user);

  res.status(200).json("This User is now blocked.");
});

/*=================== UNBLOCK USER ==================== */

export const postUnblockUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.body;
  const loggedInUserId = req.userId;
  // console.log(userId);

  const unblocker = await User.findById(loggedInUserId);

  if (!userId) {
    res.status(404);
    throw new Error("please provide a user to unblock.");
  }

  if (userId.toString() === loggedInUserId.toString()) {
    res.status(404);
    throw new Error("you can not block/unblock yourself.");
  }

  if (!unblocker.blockedUsers.includes(userId)) {
    res.status(422);
    throw new Error("This user is not blocked.");
  }

  const user = await User.findOneAndUpdate(
    { _id: loggedInUserId },
    {
      $pull: { blockedUsers: userId },
    },
    { new: true }
  );
  res.status(200).json("This User is now blocked.");
});

/*
const user = await User.aggregate([
  {
    $match: {
      _id: new mongoose.Types.ObjectId(loggedInUserId),
    },
  },
  {
    $set: {
      blockedUsers: {
        $cond: {
          if: { $isArray: "$blockedUsers" },
          then: { $concatArrays: ["$blockedUsers", [userId]] },
          else: [userId],
        },
      },
    },
  },
  {
    $merge: {
      into: "tempUser", // You can specify your existing collection name
      whenMatched: "merge",
      whenNotMatched: "insert",
    },
  },
]);

console.log(user);


*/

/*
const user = await User.aggregate([
  {
    $match: {
      _id: new mongoose.Types.ObjectId(loggedInUserId),
    },
  },
  {
    $set: {
      blockedUsers: {
        $cond: {
          if: { $isArray: "$blockedUsers" },
          then: {
            $filter: {
              input: "$blockedUsers",
              as: "blockedUser",
              cond: { $ne: ["$$blockedUser", userId] },
            },
          },
          else: [],
        },
      },
    },
  },
  {
    $merge: {
      into: "tempUser", // You can specify your existing collection name
      whenMatched: "merge",
      whenNotMatched: "insert",
    },
  },
]);

console.log(user);

*/
