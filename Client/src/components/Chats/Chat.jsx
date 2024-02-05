import { useEffect, useRef, useState } from "react";
import { ChatState } from "../../context/chatContext";
import {
  Box,
  FormControl,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Spinner,
  Text,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import ProfileModal from "../miscellaneous/ProfileModel";
import { FaArrowLeft, FaImage } from "react-icons/fa6";
import { getSender, getSenderFullInfo } from "../../config/ChatLogics";
import UpdateGroupStateModal from "../miscellaneous/UpdateGroupStateModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../../utils/axios";
import ScrollableChat from "./ScrollableChat";
import { IoIosSend } from "react-icons/io";
import ImageModal from "../ImageModal";
import Lottie from "react-lottie";
//Socket.io client
import { io } from "socket.io-client";
import animationData from "../../assets/typingAnimi.json";

const ENDPOINT = import.meta.env.VITE_ENDPOINT;

let socket, selectedChatCompare;

const Chat = ({ user, bg, color }) => {
  const {
    selectedChat,
    setSelectedChat,
    notifications,
    setNotifications,
    unreadMessages,
    setUnreadMessages,
  } = ChatState();
  const [sendingMessage, setSendingMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const [image, setImage] = useState(null);
  const queryClient = useQueryClient();
  const toast = useToast();

  const currentChat = useRef();

  currentChat.current = selectedChat;

  // console.log(selectedChat);

  /*================ LOTTIE OPTIONS ================= */

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  /*================ SOCKET FUNC ================= */

  const onChatRemove = (chat) => {
    // Check if the chat the user is leaving is the current active chat.

    if (chat?._id === currentChat.current?._id) {
      // If the user is in the group chat they're leaving, close the chat window.
      setSelectedChat("");
    }
    setNotifications((prevState) =>
      prevState.filter((msg) => msg.chat._id !== chat._id)
    );
    queryClient.invalidateQueries({
      queryKey: ["chats"],
    });
  };

  const onChatLeave = (chat) => {
    // Check if the chat the user is leaving is the current active chat.

    // console.log(chat);

    if (chat?._id === currentChat.current?._id) {
      // If the user is in the group chat they're leaving, close the chat window.
      setSelectedChat(chat);
    }
    setNotifications((prevState) =>
      prevState.filter((msg) => msg.chat._id !== chat._id)
    );
    queryClient.invalidateQueries({
      queryKey: ["chats"],
    });
  };

  const onNewChatAdd = () => {
    queryClient.invalidateQueries({
      queryKey: ["chats"],
    });
  };

  const onGroupNameChange = (chat) => {
    if (chat?._id === currentChat.current?._id) {
      // If the user is in the group chat they're leaving, close the chat window.
      setSelectedChat(chat);
    }
    queryClient.invalidateQueries({
      queryKey: ["chats"],
    });
  };

  const onMessageDelete = (chat) => {
    if (chat?._id === currentChat.current?._id) {
      queryClient.invalidateQueries({
        queryKey: ["messages", chat._id],
      });
      queryClient.invalidateQueries({
        queryKey: ["chats"],
      });
    }
  };

  const handleReceivedMessage = (newMessage) => {
    // if user already selected a chat then send notification. not send message in that selected chat
    if (
      !selectedChatCompare ||
      selectedChatCompare._id !== newMessage.chat._id
    ) {
      //! send notification
      if (!notifications.includes(newMessage)) {
        console.log("notification");
        setNotifications((prevState) => [newMessage, ...prevState]);
        queryClient.invalidateQueries({
          queryKey: ["chats"],
        });
      }
      setUnreadMessages((prev) => [newMessage, ...prev]);
    } else {
      refetch();
    }
  };

  // console.log(user.keyAccess);

  /*================ SOCKET CONNECTION ================= */

  useEffect(() => {
    socket = io(ENDPOINT, {
      withCredentials: true,
      extraHeaders: {
        Authorization: `${user?.keyAccess}`,
      },
    });
    socket.on("connected", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));
    socket.on("typingEvent", ({ senderSocketId }) => {
      if (senderSocketId !== socket.id) {
        setIsTyping(true);
      }
    });
    socket.on("stopTypingEvent", () => setIsTyping(false));
    socket.on("removeChatEvent", onChatRemove);
    socket.on("leaveChatEvent", onChatLeave);
    socket.on("newChatEvent", onNewChatAdd);
    socket.on("renameGroupEvent", onGroupNameChange);
    socket.on("messageReceived", handleReceivedMessage);
    socket.on("deleteMessageEvent", onMessageDelete);

    // Cleanup the socket event listeners
    return () => {
      socket.off("connected", () => setSocketConnected(true));
      socket.off("disconnect", () => setSocketConnected(false));
      socket.off("typingEvent", ({ senderSocketId }) => {
        if (senderSocketId !== socket.id) {
          setIsTyping(true);
        }
      });
      socket.off("stopTypingEvent", () => setIsTyping(false));
      socket.off("removeChatEvent", onChatRemove);
      socket.off("newChatEvent", onNewChatAdd);
      socket.off("leaveChatEvent", onChatLeave);
      socket.off("renameGroupEvent", onGroupNameChange);
      socket.off("messageReceived", handleReceivedMessage);
      socket.off("deleteMessageEvent", onMessageDelete);
    };
    // eslint-disable-next-line
  }, [socket]);

  /*================ GET ALL MESSAGE OF A CHAT ================= */

  const {
    isLoading,
    data: messages,
    refetch,
  } = useQuery({
    queryKey: ["messages", selectedChat?._id],
    queryFn: async () => {
      const res = await makeRequest.get(
        `/message/getMessages/${selectedChat?._id}`
      );
      return res.data;
    },
    enabled: !!selectedChat?._id,
  });

  /*================ CHAT ROOM AND MESSAGE CONNECTIONS ================= */

  useEffect(() => {
    if (selectedChat?._id) {
      socket.emit("joinChatEvent", selectedChat?._id);
    }

    // if we in a chat and got a message in another chat so we can track that where we send notifications
    selectedChatCompare = selectedChat;

    setUnreadMessages(
      unreadMessages.filter((msg) => msg.chat?._id !== selectedChat?._id)
    );

    //eslint-disable-next-line
  }, [selectedChat?._id]);

  // console.log(notifications);
  /*===================== SEND MESSAGE ===================== */

  const { mutate, isPending } = useMutation({
    mutationFn: (messageData) => {
      return makeRequest.post("/message/sendMessage", messageData);
    },
    onError: (error) => {
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
    onSuccess: (res) => {
      // console.log(res.data, "message");

      socket.emit("newMessageEvent", res?.data);
      socket.emit("stopTypingEvent", currentChat.current?._id);
      queryClient.invalidateQueries({
        queryKey: ["messages", selectedChat?._id],
      });

      queryClient.invalidateQueries({
        queryKey: ["chats"],
      });
      setSendingMessage("");
    },
  });

  /*===================== CHANGE HANDLER ===================== */

  let timer;

  // console.log(currentChat.current?._id);

  const sendingMessageInputHandler = (e) => {
    setSendingMessage(e.target.value);

    // Typing indicates logic
    if (!socketConnected) return;
    clearTimeout(timer);

    if (!typing) {
      setTyping(true);

      socket.emit("typingEvent", {
        chatId: currentChat.current?._id,
        senderSocketId: socket.id, // Include sender's socket id
      });
    }
    let lastTypingTime = new Date().getTime();
    let timerLength = 3000;

    timer = setTimeout(() => {
      let timeNow = new Date().getTime();
      let timeDiff = timeNow - lastTypingTime;

      if (timeDiff >= timerLength && typing) {
        socket.emit("stopTypingEvent", {
          chatId: currentChat.current?._id,
          senderSocketId: socket.id, // Include sender's socket id
        });
        setTyping(false);
      }
    }, timerLength);
  };

  /*===================== SEND MESSAGE ON CLICK ===================== */

  const sendMessageSubmitHandler = (e) => {
    e.preventDefault();
    if (!sendingMessage) {
      toast({
        title: "Please write a message.",
        description: "write a message before sending it.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    mutate({
      chatId: selectedChat?._id,
      content: sendingMessage,
    });
  };

  /*===================== SEND MESSAGE ON ENTER ===================== */

  const onKeyDownSendMessageHandler = (e) => {
    if (e.key === "Enter" && sendingMessage) {
      mutate({
        chatId: selectedChat?._id,
        content: sendingMessage,
      });
      return;
    }
  };

  /*===================== SEND IMAGE MESSAGE ===================== */

  const SendImageHandler = (UploadedImg) => {
    if (UploadedImg) {
      mutate({
        chatId: selectedChat?._id,
        content: UploadedImg,
      });
    }
    return;
  };

  return (
    <>
      {selectedChat ? (
        <>
          <Box
            fontSize={{ base: "22px", md: "24px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            display="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
          >
            <Icon
              display={{ base: "flex", lg: "none" }}
              as={FaArrowLeft}
              cursor={"pointer"}
              onClick={() => setSelectedChat("")}
            />
            <span className="hideSpan"></span>
            {/* {messages &&
              
              ))} */}
            {!selectedChat.isGroupChat ? (
              <>
                {getSender(user, selectedChat.users)}
                <ProfileModal
                  user={getSenderFullInfo(user, selectedChat.users)}
                  isProfile={false}
                />
              </>
            ) : (
              <>
                <Box
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Text>{selectedChat.chatName.toUpperCase()}</Text>
                  <Text fontSize={15}>
                    {selectedChat.users.length} members in this group
                  </Text>
                </Box>

                <UpdateGroupStateModal user={user} />
              </>
            )}
          </Box>
          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#000"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {isLoading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : messages && messages.length > 0 ? (
              <div className="messages">
                <ScrollableChat messages={messages} user={user} />
              </div>
            ) : (
              <Box
                display={"flex"}
                alignItems={"center"}
                justifyContent={"center"}
                h={"100%"}
              >
                <Text color={"#fff"} fontWeight={"600"} fontSize={22}>
                  No Messages Yet. Let&apos;s Start Baate
                </Text>
              </Box>
            )}

            {isTyping ? (
              <div
                style={{
                  marginBottom: "0px",
                  marginTop: "15px",
                  marginLeft: "42px",
                  width: "70px",
                }}
              >
                <Lottie options={defaultOptions} width={70} height={30} />
              </div>
            ) : (
              <></>
            )}

            <FormControl
              onKeyDown={onKeyDownSendMessageHandler}
              id="first-name"
              isRequired
              mt={3}
              display={"flex"}
              alignItems={"center"}
              gap={2}
            >
              <label htmlFor="image">
                <Icon as={FaImage} fontSize={30} color={"#2192FF"} mt={1} />
              </label>
              <Input
                hidden
                type="file"
                id="image"
                onChange={(e) => setImage(e.target.files[0])}
              />
              <ImageModal
                image={image}
                setImage={setImage}
                SendImageHandler={SendImageHandler}
              />
              <InputGroup>
                <Textarea
                  bg={bg}
                  color={color}
                  placeholder="Send a message.."
                  value={sendingMessage}
                  onChange={sendingMessageInputHandler}
                  autoComplete="off"
                  resize={"none"}
                  rows={1}
                  pr={10}
                />
                <InputRightElement w={"4.5rem"}>
                  {isPending ? (
                    <Spinner />
                  ) : (
                    <Icon
                      fontSize={30}
                      color={"#068FFF"}
                      cursor={"pointer"}
                      as={IoIosSend}
                      ml={6}
                      onClick={sendMessageSubmitHandler}
                    />
                  )}
                </InputRightElement>
              </InputGroup>
            </FormControl>
          </Box>
        </>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
        >
          <Text fontSize="3xl" pb={3} fontFamily="Work sans">
            Click on a chat to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default Chat;
