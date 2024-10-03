import {
  Avatar,
  Box,
  Icon,
  Img,
  Text,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import ScrollableFeed from "react-scrollable-feed";
import { memo, useRef, useState } from "react";
import {
  isFirstMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../../config/ChatLogics";
import ProfileModal from "../miscellaneous/ProfileModel";
import moment from "moment";
import { FaDeleteLeft } from "react-icons/fa6";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../../utils/axios";

const cursorFun = (message, user) => {
  return message.sender._id === user._id || message.chat.groupAdmin === user._id
    ? "pointer"
    : "auto";
};

const ScrollableChat = memo(function ScrollableChat({ messages, user }) {
  // console.log(messages);
  const [deleteMessageModal, setDeleteMessageModal] = useState("");

  const queryClient = useQueryClient();
  const toast = useToast();

  const messageRef = useRef(null);

  const { mutate } = useMutation({
    mutationFn: (messageData) => {
      return makeRequest.delete(
        `/message/deleteMessage?messageId=${messageData.messageId}&&chatId=${messageData.chatId}&&lastMessageId=${messageData.latestMessageNow}`
      );
    },
    onError: (error) => {
      console.log(error);
      const errorMessage =
        error?.response?.data?.message || "Something went wrong.";
      toast({
        title: "Error Occured!",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    },
    onSuccess: (res, messageData) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", messageData.chatId],
      });
      queryClient.invalidateQueries({
        queryKey: ["chats"],
      });
    },
  });

  // console.log(data);

  const deleteMessageHandler = (e, messageId, chatId) => {
    e.stopPropagation();
    // console.log("delete");
    let latestMessageNow = null;
    if (messageId === messages[messages.length - 1]._id) {
      latestMessageNow = messages[messages.length - 2]?._id;
    }

    // console.log(latestMessageNow, "last message");

    mutate({
      messageId: messageId,
      chatId: chatId,
      latestMessageNow: latestMessageNow,
    });
  };

  return (
    <ScrollableFeed>
      {messages &&
        messages.map((message, i) => {
          const currentMessageDate = moment(message.updatedAt).format("LL");
          const today = moment(new Date()).format("LL");

          const previousMessage =
            i > 0 ? moment(messages[i - 1].updatedAt).format("LL") : null;

          let userWhoCanDeleteMessage = [
            message.sender._id,
            message.chat.groupAdmin,
          ].includes(user._id);

          return (
            <div key={message._id}>
              {(!previousMessage || previousMessage !== currentMessageDate) && (
                <Text
                  style={{
                    fontSize: "14px",
                    color: "#fff",
                    marginInline: "auto",
                    marginBottom: "22px",
                    marginTop: "22px",
                    border: "1px solid #fff",
                    borderRadius: "10rem",
                    width: "max-content",
                    padding: "3px 15px",
                  }}
                >
                  {currentMessageDate === today ? "Today" : currentMessageDate}
                </Text>
              )}

              <div
                style={{
                  display: "flex",
                  position: "relative",
                }}
              >
                {(isSameSender(messages, message, i, user._id) ||
                  isFirstMessage(messages, i, user._id)) && (
                  <Tooltip
                    label={message.sender.name}
                    placement="bottom-start"
                    hasArrow
                  >
                    <div>
                      <ProfileModal user={message.sender} isProfile={false}>
                        <Avatar
                          mt="7px"
                          mr={1}
                          size="sm"
                          cursor="pointer"
                          name={message.sender.name}
                          src={message.sender.image}
                        />
                      </ProfileModal>
                    </div>
                  </Tooltip>
                )}

                {message.content.includes(
                  "http://res.cloudinary.com/vipinpatidar5/"
                ) ? (
                  <Box
                    ref={messageRef}
                    style={{
                      backgroundColor: `${
                        message.sender._id === user._id ? "#BEE3F8" : "#B9F5D0"
                      }`,
                      marginLeft: isSameSenderMargin(
                        messages,
                        message,
                        i,
                        user._id
                      ),
                      marginTop: isSameUser(messages, message, i, user._id)
                        ? 3
                        : 10,
                      color: "#000",
                      paddingInline: "6px",
                      paddingTop: "6px",
                      borderRadius: `${18 + 6}px`,
                      position: "relative",
                    }}
                    cursor={`${cursorFun(message, user)}`}
                    maxWidth={{ base: "60%", md: "35%" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        deleteMessageModal === message._id &&
                        userWhoCanDeleteMessage
                      ) {
                        setDeleteMessageModal("");
                      } else if (userWhoCanDeleteMessage) {
                        setDeleteMessageModal(message._id);
                      }
                    }}
                  >
                    <Img
                      src={message.content.split("{&caption&}")[0]}
                      width={"100%"}
                      borderRadius={18}
                    />
                    {message.content.split("{&caption&}")[1] && (
                      <Text pt={2} ml={"16px"} borderRadius={18}>
                        {message.content.split("{&caption&}")[1]}
                      </Text>
                    )}
                    <Text
                      style={{
                        fontSize: "12px",
                        color: "#000",
                        textAlign: "right",
                        marginRight: "12px",
                        marginTop: "2px",
                        paddingBottom: "3px",
                      }}
                    >
                      {moment(message.updatedAt).format("LT")}
                    </Text>
                    {deleteMessageModal === message._id &&
                      userWhoCanDeleteMessage && (
                        <Icon
                          as={FaDeleteLeft}
                          color={"red"}
                          fontSize={28}
                          borderRadius={"50%"}
                          alignSelf={"center"}
                          transform={
                            message.sender._id === user._id
                              ? "rotate(180deg)"
                              : "rotate(0deg)"
                          }
                          position={"absolute"}
                          left={message.sender._id === user._id ? "-28px" : ""}
                          right={message.sender._id === user._id ? "" : "-28px"}
                          top={"30%"}
                          zIndex={1}
                          onClick={(e) =>
                            deleteMessageHandler(
                              e,
                              message._id,
                              message.chat._id
                            )
                          }
                        />
                      )}
                  </Box>
                ) : (
                  <Text
                    ref={messageRef}
                    style={{
                      backgroundColor: `${
                        message.sender._id === user._id ? "#BEE3F8" : "#B9F5D0"
                      }`,
                      marginLeft: isSameSenderMargin(
                        messages,
                        message,
                        i,
                        user._id
                      ),
                      marginTop: isSameUser(messages, message, i, user._id)
                        ? 3
                        : 10,
                      borderRadius: `${
                        message.sender._id === user._id
                          ? "18px"
                          : "0rem 18px 18px 18px"
                      }`,
                      padding: "5px 15px",
                      paddingBottom: "0px",
                      position: "relative",
                      color: "#000",
                    }}
                    cursor={`${cursorFun(message, user)}`}
                    maxWidth={{ base: "80%", md: "70%" }}
                    onClick={(e) => {
                      e.stopPropagation();

                      if (
                        deleteMessageModal === message._id &&
                        userWhoCanDeleteMessage
                      ) {
                        setDeleteMessageModal("");
                      } else if (userWhoCanDeleteMessage) {
                        setDeleteMessageModal(message._id);
                      }
                    }}
                  >
                    {message.content}
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#000",
                        display: "block",
                        textAlign: "right",
                        paddingBottom: "3px",
                      }}
                    >
                      {moment(message.updatedAt).format("LT")}
                    </span>
                    {deleteMessageModal === message._id &&
                      userWhoCanDeleteMessage && (
                        <Icon
                          as={FaDeleteLeft}
                          color={"red"}
                          fontSize={28}
                          borderRadius={"50%"}
                          alignSelf={"center"}
                          transform={
                            message.sender._id === user._id
                              ? "rotate(180deg)"
                              : "rotate(0deg)"
                          }
                          position={"absolute"}
                          left={message.sender._id === user._id ? "-28px" : ""}
                          right={message.sender._id === user._id ? "" : "-28px"}
                          top={"30%"}
                          zIndex={1}
                          onClick={(e) =>
                            deleteMessageHandler(
                              e,
                              message._id,
                              message.chat._id
                            )
                          }
                        />
                      )}
                  </Text>
                )}
              </div>
            </div>
          );
        })}
    </ScrollableFeed>
  );
});

export default ScrollableChat;
