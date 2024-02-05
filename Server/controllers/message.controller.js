import asyncHandler from "express-async-handler";
import { User } from "../models/user.model.js";
import { Chat } from "../models/chat.model.js";
import { Message } from "../models/message.model.js";
import mongoose from "mongoose";
import { emitSocketEvent } from "../socket/socket.js";

const chatMessageCommonAggregation = () => {
  return [
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "sender",
        as: "sender",
        pipeline: [
          {
            $project: {
              name: 1,
              image: 1,
              email: 1,
              status: 1,
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
    {
      $lookup: {
        from: "chats",
        foreignField: "_id",
        localField: "chat",
        as: "chat",
        pipeline: [
          {
            // get details of the users
            $lookup: {
              from: "users",
              foreignField: "_id",
              localField: "users",
              as: "users",
              pipeline: [
                {
                  $project: {
                    name: 1,
                    image: 1,
                    email: 1,
                    status: 1,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      $unwind: "$chat",
    },
  ];
};

/*=================== GET A CHAT ALL MESSAGE==================== */

export const getAllMessages = asyncHandler(async (req, res, next) => {
  try {
    const { chatId } = req.params;
    //  console.log(chatId);

    const selectedChat = await Chat.findById(chatId);

    if (!selectedChat) {
      res.status(404);
      throw new Error("Chat does not exist");
    }

    // Only send messages if the logged in user is a part of the chat he is requesting messages of
    if (!selectedChat.users?.includes(req.userId)) {
      res.status(400);
      throw new Error("User is not a part of this chat");
    }

    const messages = await Message.aggregate([
      {
        $match: {
          chat: new mongoose.Types.ObjectId(chatId),
        },
      },
      {
        $lookup: {
          from: "users",
          foreignField: "_id",
          localField: "sender",
          as: "sender",
          pipeline: [
            {
              $project: {
                name: 1,
                image: 1,
                email: 1,
                status: 1,
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
      {
        $lookup: {
          from: "chats",
          foreignField: "_id",
          localField: "chat",
          as: "chat",
        },
      },
      {
        $unwind: "$chat",
      },
      {
        $sort: {
          createdAt: 1,
        },
      },
    ]);

    return res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
});

/*=================== SEND MESSAGE==================== */

export const postSendMessage = asyncHandler(async (req, res, next) => {
  const { chatId, content } = req.body;
  try {
    if (!content) {
      res.status(400);
      throw new Error("Message content is required");
    }

    const selectedChat = await Chat.findById(chatId);
    const loggedInUser = await User.findById(req.userId);

    if (!selectedChat) {
      res.status(404);
      throw new Error("Chat does not exist");
    }

    // Check if user is blocked by other chat user or not.

    if (!selectedChat.isGroupChat) {
      const otherUserId = selectedChat.users.find(
        (user) => user.toString() !== req.userId.toString()
      );
      // console.log(otherUserId, "other user");

      if (loggedInUser.blockedUsers.includes(otherUserId)) {
        res.status(401);
        throw new Error(
          "You Have blocked this user. Unblock the user if you want to chat"
        );
      }

      const otherSideUser = await User.findById(otherUserId);

      if (otherSideUser.blockedUsers.includes(req.userId)) {
        res.status(401);
        throw new Error("You are blocked by this user. cannot send messages.");
      }
    }

    // Create a new message instance with appropriate metadata
    const message = await Message.create({
      sender: new mongoose.Types.ObjectId(req.userId),
      content: content || "",
      chat: new mongoose.Types.ObjectId(chatId),
    });

    // update the chat's last message which could be utilized to show last message in the list item
    const chat = await Chat.findByIdAndUpdate(
      chatId,
      {
        $set: {
          latestMessage: message._id,
        },
      },
      { new: true }
    );

    // structure the message
    const messages = await Message.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(message._id),
        },
      },
      ...chatMessageCommonAggregation(),
    ]);

    // Store the aggregation result
    const receivedMessage = messages[0];

    if (!receivedMessage) {
      res.status(500);
      throw new Error("Internal server error");
    }

    res.status(200).json(receivedMessage);
  } catch (error) {
    next(error);
  }
});

/*=================== DELETE MESSAGE==================== */

export const deleteMessage = asyncHandler(async (req, res, next) => {
  try {
    const { chatId, messageId, lastMessageId } = req.query;

    // console.log(chatId, messageId, typeof lastMessageId);

    const selectedChat = await Chat.findById(chatId);
    const message = await Message.findById(messageId);

    if (!selectedChat) {
      res.status(404);
      throw new Error("Chat does not exist");
    }

    let chatMembers = selectedChat.users;

    if (!chatMembers.includes(req.userId)) {
      res.status(404);
      throw new Error("You cannot delete other users message.");
    }

    // console.log(message.sender?.toString() === req.userId?.toString());
    // console.log(selectedChat.groupAdmin?.toString() !== req.userId?.toString());
    // console.log(selectedChat.isGroupChat);

    if (
      selectedChat.isGroupChat &&
      message.sender?.toString() !== req.userId?.toString() &&
      selectedChat.groupAdmin?.toString() !== req.userId?.toString()
    ) {
      res.status(404);
      throw new Error(
        "You cannot delete other users message.only admin can delete."
      );
    } else if (
      !selectedChat.isGroupChat &&
      message.sender?.toString() !== req.userId?.toString()
    ) {
      res.status(404);
      throw new Error("You cannot delete other users message.");
    }

    await Message.findByIdAndDelete(messageId);

    if (
      lastMessageId !== "undefined" &&
      lastMessageId !== undefined &&
      lastMessageId !== "null" &&
      lastMessageId !== null
    ) {
      selectedChat.latestMessage = lastMessageId;
      await selectedChat.save();
    }

    selectedChat?.users?.forEach((participant) => {
      if (participant._id.toString() === req.userId.toString()) return; // don't emit the event for the logged in use as he is the one who is deleting
      // emit event to other participants with left chat as a selectedChat
      emitSocketEvent(
        req,
        participant._id?.toString(),
        "deleteMessageEvent",
        selectedChat
      );
    });

    res.status(200).json("messageDeleted successfully.");
  } catch (error) {
    next(error);
  }
});
