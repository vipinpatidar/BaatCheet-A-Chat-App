import asyncHandler from "express-async-handler";
import { User } from "../models/user.model.js";
import { Chat } from "../models/chat.model.js";
import { Message } from "../models/message.model.js";
import mongoose from "mongoose";
import { emitSocketEvent } from "../socket/socket.js";

const chatCommonAggregation = () => {
  return [
    {
      // lookup for the participants present
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "users",
        as: "users",
        pipeline: [
          {
            $project: {
              password: 0,
            },
          },
        ],
      },
    },
    {
      // lookup for the group chats
      $lookup: {
        from: "messages",
        foreignField: "_id",
        localField: "latestMessage",
        as: "latestMessage",
        pipeline: [
          {
            // get details of the sender
            $lookup: {
              from: "users",
              foreignField: "_id",
              localField: "sender",
              as: "sender",
              pipeline: [
                {
                  $project: {
                    password: 0,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              sender: { $first: "$sender" },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        latestMessage: { $first: "$latestMessage" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "groupAdmin",
        foreignField: "_id",
        as: "groupAdmin",
        pipeline: [
          {
            $project: {
              password: 0,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: "$groupAdmin",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];
};

/*=================== Delete Messages with chats ==================== */

const deleteCascadeChatMessages = async (chatId) => {
  // delete all the messages
  await Message.deleteMany({
    chat: new mongoose.Types.ObjectId(chatId),
  });
};

/*=================== GET ALL CHATS ==================== */

export const getAllChats = asyncHandler(async (req, res, next) => {
  try {
    // console.log(req.userId);
    const chats = await Chat.aggregate([
      {
        $match: {
          users: {
            $elemMatch: { $eq: new mongoose.Types.ObjectId(req.userId) },
          },
        },
      },
      {
        $sort: {
          updatedAt: -1,
        },
      },
      ...chatCommonAggregation(),
    ]);

    res.status(200).json(chats || []);
  } catch (error) {
    next(error);
  }
});

/*=================== CREATE CHAT ONE TO ONE ==================== */

export const postCreateChat = asyncHandler(async (req, res, next) => {
  const { receiverId } = req.body;

  // Check if it's a valid receiver
  const receiver = await User.findById(receiverId);

  if (!receiver) {
    res.status(404);
    throw new Error("Receiver does not exist");
  }

  // check if receiver is not the user who is requesting a chat
  if (receiver._id.toString() === req.userId.toString()) {
    res.status(400);
    throw new Error("You cannot chat with yourself");
  }

  //   console.log(req.userId, "current user");
  //   console.log(receiverId, "receiver");

  const chat = await Chat.aggregate([
    {
      $match: {
        isGroupChat: false, // avoid group chats. This controller is responsible for one on one chats
        // Also, filter chats with participants having receiver and logged in user only
        $and: [
          {
            users: {
              $elemMatch: { $eq: new mongoose.Types.ObjectId(req.userId) },
            },
          },
          {
            users: {
              $elemMatch: { $eq: new mongoose.Types.ObjectId(receiverId) },
            },
          },
        ],
      },
    },
    ...chatCommonAggregation(),
  ]);

  //   console.log(chat);

  if (chat.length) {
    // if we find the chat that means user already has created a chat
    return res.status(200).json(chat[0]);
  }

  // if not we need to create a new one on one chat
  const newChatInstance = await Chat.create({
    chatName: "One on one chat",
    users: [req.userId, receiverId], // add receiver and logged in user as participants
    groupAdmin: null,
  });

  // structure the chat as per the common aggregation to keep the consistency
  const createdChat = await Chat.aggregate([
    {
      $match: {
        _id: newChatInstance._id,
      },
    },
    ...chatCommonAggregation(),
  ]);

  const payload = createdChat[0]; // store the aggregation result

  if (!payload) {
    res.status(500);
    throw new Error("Internal server error");
  }

  res.status(200).json(payload);
});

/*=================== CREATE GROUP CHAT ==================== */

export const postCreateGroupChat = asyncHandler(async (req, res, next) => {
  const { groupName, groupMembers } = req.body;

  if (!groupMembers || !groupName) {
    res.status(422);
    throw new Error("Please add group name or group participants");
  }

  const members = [...new Set([...groupMembers, req.userId.toString()])]; // check for duplicates

  if (members.length < 3) {
    // check after removing the duplicate
    // We want group chat to have minimum 3 members including admin
    res.status(422);
    throw new Error("Group should have 3 members. Add more members.");
  }

  // Create a group chat with provided members
  const groupChat = await Chat.create({
    chatName: groupName,
    isGroupChat: true,
    users: members,
    groupAdmin: req.userId,
  });

  // structure the chat
  const chat = await Chat.aggregate([
    {
      $match: {
        _id: groupChat._id,
      },
    },
    ...chatCommonAggregation(),
  ]);

  const payload = chat[0];

  if (!payload) {
    res.status(500);
    throw new Error("Internal server error");
  }

  res.status(200).json(payload);
});

/*=================== RENAME GROUP ==================== */

export const putRenameGroup = asyncHandler(async (req, res, next) => {
  const { groupId, groupName } = req.body;

  // check for chat existence
  const groupChat = await Chat.findOne({
    _id: new mongoose.Types.ObjectId(groupId),
    isGroupChat: true,
  });

  if (!groupChat) {
    res.status(404);
    throw new Error("Group chat does not exist");
  }

  // only admin can change the name
  if (groupChat.groupAdmin?.toString() !== req.userId?.toString()) {
    res.status(401);
    throw new Error("You are not an admin. You can't change group name.");
  }

  const updatedGroupChat = await Chat.findByIdAndUpdate(
    groupId,
    {
      $set: {
        chatName: groupName,
      },
    },
    { new: true }
  );

  const chat = await Chat.aggregate([
    {
      $match: {
        _id: updatedGroupChat._id,
      },
    },
    ...chatCommonAggregation(),
  ]);

  const payload = chat[0];
  if (!payload) {
    res.status(500);
    throw new Error("Internal server error");
  }

  payload?.users?.forEach((participant) => {
    if (participant._id.toString() === req.userId.toString()) return; // don't emit the event for the logged in use as he is the one who is deleting
    // emit event to other participants with left chat as a payload
    emitSocketEvent(
      req,
      participant._id?.toString(),
      "renameGroupEvent",
      payload
    );
  });

  res.status(200).json(payload);
});

/*=================== ADD TO GROUP ==================== */

export const putAddToGroupChat = asyncHandler(async (req, res, next) => {
  const { groupId, participantId } = req.body;

  // check if chat is a group
  const groupChat = await Chat.findOne({
    _id: new mongoose.Types.ObjectId(groupId),
    isGroupChat: true,
  });

  if (!groupChat) {
    res.status(404);
    throw new Error("Group chat does not exist");
  }

  // check if user who is adding is a group admin
  if (groupChat.groupAdmin?.toString() !== req.userId?.toString()) {
    res.status(401);
    throw new Error(
      "You are not allowed to add new members. only admins can add new members."
    );
  }

  const existingParticipants = groupChat.users;

  // check if the participant that is being added in a part of the group
  if (existingParticipants?.includes(participantId)) {
    res.status(404);
    throw new Error("Participant already in this group chat");
  }

  const updatedChat = await Chat.findByIdAndUpdate(
    groupId,
    {
      $push: {
        users: participantId, // add new participant id
      },
    },
    { new: true }
  );

  const chat = await Chat.aggregate([
    {
      $match: {
        _id: updatedChat._id,
      },
    },
    ...chatCommonAggregation(),
  ]);

  const payload = chat[0];

  emitSocketEvent(req, participantId, "newChatEvent", payload);

  if (!payload) {
    res.status(500);
    throw new Error("Internal server error");
  }

  res.status(200).json(payload);
});

/*=================== REMOVE FROM GROUP ==================== */

export const putRemoveFromGroupChat = asyncHandler(async (req, res, next) => {
  const { groupId, participantId } = req.body;

  // check if chat is a group
  const groupChat = await Chat.findOne({
    _id: new mongoose.Types.ObjectId(groupId),
    isGroupChat: true,
  });

  if (!groupChat) {
    res.status(404);
    throw new Error("Group chat does not exist");
  }

  // check if user who is adding is a group admin
  if (groupChat.groupAdmin?.toString() !== req.userId?.toString()) {
    res.status(401);
    throw new Error(
      "You are not allowed to remove members. only admins can remove members."
    );
  }
  const existingParticipants = groupChat.users;

  // check if the participant that removing is a part of the group
  if (!existingParticipants?.includes(participantId)) {
    res.status(404);
    throw new Error("Participant does not exist in this group chat");
  }

  const updatedChat = await Chat.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(groupId) },
    [
      {
        $set: {
          users: {
            $filter: {
              input: "$users",
              as: "user",
              cond: {
                $ne: ["$$user", new mongoose.Types.ObjectId(participantId)],
              },
            },
          },
          groupAdmin: {
            $cond: {
              if: {
                $eq: [
                  "$groupAdmin",
                  new mongoose.Types.ObjectId(participantId),
                ],
              },
              then: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$users",
                      as: "user",
                      cond: {
                        $ne: [
                          "$$user",
                          new mongoose.Types.ObjectId(participantId),
                        ],
                      },
                    },
                  },
                  0, // Index of the new group admin
                ],
              },
              else: "$groupAdmin", // Keep the existing group admin
            },
          },
        },
      },
    ],
    { new: true }
  );
  // console.log(updatedChat);

  const chat = await Chat.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(updatedChat._id),
      },
    },
    ...chatCommonAggregation(),
  ]);

  const payload = chat[0];

  emitSocketEvent(req, participantId, "removeChatEvent", payload);

  // Check if the users array is empty, and delete the chat if true
  if (!updatedChat.users || updatedChat.users.length === 0) {
    await Chat.findByIdAndDelete(groupId);
    await deleteCascadeChatMessages(groupId);
  }

  if (!payload) {
    res.status(500);
    throw new Error("Internal server error");
  }

  res.status(200).json(payload);
});

/*=================== Leave FROM GROUP ==================== */

export const putLeaveGroup = asyncHandler(async (req, res, next) => {
  const { groupId } = req.body;

  // check if chat is a group
  const groupChat = await Chat.findOne({
    _id: new mongoose.Types.ObjectId(groupId),
    isGroupChat: true,
  });

  if (!groupChat) {
    res.status(404);
    throw new Error("Group chat does not exist");
  }

  const existingParticipants = groupChat.users;

  // check if the participant that leaving is a part of the group
  if (!existingParticipants?.includes(req.userId)) {
    res.status(404);
    throw new Error("You are not part of this group chat.");
  }

  const updatedChat = await Chat.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(groupId) },
    [
      {
        $set: {
          users: {
            $filter: {
              input: "$users",
              as: "user",
              cond: {
                $ne: ["$$user", new mongoose.Types.ObjectId(req.userId)],
              },
            },
          },
          groupAdmin: {
            $cond: {
              if: {
                $eq: ["$groupAdmin", new mongoose.Types.ObjectId(req.userId)],
              },
              then: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$users",
                      as: "user",
                      cond: {
                        $ne: [
                          "$$user",
                          new mongoose.Types.ObjectId(req.userId),
                        ],
                      },
                    },
                  },
                  0, // Index of the new group admin
                ],
              },
              else: "$groupAdmin", // Keep the existing group admin
            },
          },
        },
      },
    ],
    { new: true }
  );

  // console.log(updatedChat);

  const chat = await Chat.aggregate([
    {
      $match: {
        _id: updatedChat._id,
      },
    },
    ...chatCommonAggregation(),
  ]);

  const payload = chat[0];

  payload?.users?.forEach((participant) => {
    if (participant._id.toString() === req.userId.toString()) return; // don't emit the event for the logged in use as he is the one who is deleting
    // emit event to other participants with left chat as a payload
    emitSocketEvent(
      req,
      participant._id?.toString(),
      "leaveChatEvent",
      payload
    );
  });

  if (!payload) {
    res.status(500);
    throw new Error("Internal server error");
  }

  res.status(200).json(payload);
});

/*=================== Delete A Chat ==================== */

export const deleteAChat = asyncHandler(async (req, res, next) => {
  const { chatId, isGroup } = req.query;

  let query =
    isGroup === "true"
      ? {
          $match: {
            _id: new mongoose.Types.ObjectId(chatId),
            isGroupChat: true,
          },
        }
      : {
          $match: {
            _id: new mongoose.Types.ObjectId(chatId),
            isGroupChat: false,
          },
        };

  // console.log(query);

  // check for the group chat existence
  const resultChat = await Chat.aggregate([query]);

  const chat = resultChat[0];

  if (!chat) {
    res.status(404);
    throw new Error("This chat does not exist");
  }

  // check if the user who is deleting is the group admin
  if (
    chat.groupAdmin?.toString() !== req.userId?.toString() &&
    isGroup === "true"
  ) {
    res.status(404);
    throw new Error("Only admin can delete the group");
  }

  // console.log(chat);

  await Chat.findByIdAndDelete(chatId); // delete the chat

  await deleteCascadeChatMessages(chatId); // remove all messages and attachments associated with the chat

  // logic to emit socket event about the group chat deleted to the participants
  chat?.users?.forEach((participant) => {
    if (participant._id.toString() === req.userId.toString()) return; // don't emit the event for the logged in use as he is the one who is deleting
    // emit event to other participants with left chat as a payload
    emitSocketEvent(req, participant._id?.toString(), "removeChatEvent", chat);
  });

  return res.status(200).json("Chat deleted successfully");
});
