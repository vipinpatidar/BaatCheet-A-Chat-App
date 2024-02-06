import { ChatState } from "../../context/chatContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Avatar,
  Box,
  Button,
  Icon,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import ChatLoading from "../ChatLoading";
import { FaPlus } from "react-icons/fa6";
import { makeRequest } from "../../utils/axios";
import { getSender, getSenderImage } from "../../config/ChatLogics";
import GroupChatModal from "../miscellaneous/GroupChatModal";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const MyChats = ({ user, bg, color }) => {
  const [deleteModal, setDeleteModal] = useState("");
  const { selectedChat, setSelectedChat, unreadMessages, setNotifications } =
    ChatState();

  const queryClient = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();

  // console.log(user.setId);

  const {
    isLoading,
    data: chats,
    error,
  } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const res = await makeRequest.get("/chat/getChats");
      return res.data;
    },
  });

  // console.log(user?.keyAccess, user?.name);

  useEffect(() => {
    if (error?.response?.status === 403) {
      navigate("/");
      user.setId(null);
      localStorage.removeItem("userInfo");
      window.location.href = "/";
    }
    //eslint-disable-next-line
  }, [error]);

  /*================ Delete Chat ================= */

  const { mutate } = useMutation({
    mutationFn: async (chatData) => {
      return makeRequest.delete(
        `/chat/deleteChat?chatId=${chatData.chatId}&&isGroup=${chatData.isGroup}`
      );
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
    onSuccess: (res, chatData) => {
      setNotifications((prevState) =>
        prevState.filter((msg) => msg.chat._id !== chatData.chatId)
      );

      queryClient.invalidateQueries({
        queryKey: ["chats"],
      });
    },
  });

  const deleteChatHandler = async (chatId, e, isGroup) => {
    e.stopPropagation();

    mutate({
      chatId: chatId,
      isGroup: isGroup,
    });

    setDeleteModal("");
  };

  // console.log(chats);

  return (
    <Box
      display={{ base: selectedChat ? "none" : "flex", lg: "flex" }}
      flexDir="column"
      alignItems="center"
      h={"100%"}
      py={3}
      px={{ base: 2, md: 3 }}
      bg={bg}
      color={color}
      w={{ base: "100%", lg: "31%" }}
      borderRadius="lg"
      borderWidth="1px"
      height={"100%"}
    >
      <Box
        pb={3}
        px={{ base: 2, md: 4 }}
        fontSize={{ base: "26px", md: "26px" }}
        fontFamily="Work sans"
        display="flex"
        w="100%"
        justifyContent="space-between"
        alignItems="center"
      >
        Chats
        <GroupChatModal user={user}>
          <Button
            display="flex"
            fontSize={{ base: "17px", md: "10px", lg: "17px" }}
          >
            New Group Chat
            <Icon as={FaPlus} ml={3} />
          </Button>
        </GroupChatModal>
      </Box>
      <Box
        display="flex"
        flexDir="column"
        p={3}
        w="100%"
        h="100%"
        borderRadius="lg"
        overflowY="hidden"
      >
        {chats ? (
          !isLoading && chats.length > 0 ? (
            <Stack overflowY="scroll" height={"100%"}>
              {chats.map((chat) => (
                <Box
                  onClick={() => {
                    chat._id === selectedChat?._id
                      ? setSelectedChat()
                      : setSelectedChat(chat);
                  }}
                  cursor="pointer"
                  bg={
                    selectedChat?._id === chat._id
                      ? "#068FFF"
                      : unreadMessages.some((meg) => meg.chat._id === chat._id)
                      ? "#B6FFCE"
                      : "#E8E8E8"
                  }
                  color={selectedChat?._id === chat._id ? "white" : "black"}
                  pl={chat.isGroupChat ? 3 : 6}
                  pr={"12px"}
                  py={3}
                  borderRadius="lg"
                  key={chat._id}
                  display={"flex"}
                  alignItems={"center"}
                  gap={4}
                  position={"relative"}
                >
                  {!chat.isGroupChat ? (
                    <Avatar
                      src={getSenderImage(user, chat.users)}
                      alt="user Image"
                      border={"2px solid black"}
                    />
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0px",
                        width: "84px",
                      }}
                    >
                      {chat.users.slice(0, 3).map((user, idx) => (
                        <Avatar
                          src={user.image}
                          key={user._id}
                          alt="user"
                          ml={idx > 0 ? -idx - 26.9 : idx}
                          zIndex={
                            idx > 0
                              ? chat.users.length - idx
                              : chat.users.length
                          }
                          width={"45px"}
                          height={"45px"}
                          border={"2px solid black"}
                        />
                      ))}
                    </div>
                  )}
                  <Box>
                    <Text>
                      {!chat.isGroupChat
                        ? getSender(user, chat.users)
                        : chat.chatName}
                    </Text>
                    {chat.latestMessage && (
                      <Text fontSize="xs">
                        <b>
                          {chat.latestMessage?.sender?.name?.split(" ")[0]} :{" "}
                        </b>
                        {chat.latestMessage.content.includes(
                          "http://res.cloudinary.com/vipinpatidar5/"
                        )
                          ? "Image"
                          : chat.latestMessage.content.length > 28
                          ? chat.latestMessage.content.substring(0, 28) + "..."
                          : chat.latestMessage.content}
                      </Text>
                    )}
                  </Box>
                  {unreadMessages.some((meg) => meg.chat._id === chat._id) && (
                    <Box
                      w={"22px"}
                      h={"22px"}
                      bg={"royalblue"}
                      borderRadius={"50%"}
                      color={"white"}
                      display={"flex"}
                      alignItems={"center"}
                      fontSize={14}
                      justifyContent={"center"}
                      mr={"0px"}
                      ml={"auto"}
                    >
                      {unreadMessages.filter((meg) => meg.chat._id === chat._id)
                        .length > 9
                        ? "9+"
                        : unreadMessages.filter(
                            (meg) => meg.chat._id === chat._id
                          ).length}
                    </Box>
                  )}
                  <Box
                    ml={
                      unreadMessages.some((meg) => meg.chat._id === chat._id)
                        ? 0
                        : "auto"
                    }
                    w={"30px"}
                    h={"30px"}
                    borderRadius={"50%"}
                    display={"flex"}
                    alignItems={"center"}
                    fontSize={16}
                    justifyContent={"center"}
                    _hover={{ bg: "#ccc" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (deleteModal === chat._id) {
                        setDeleteModal("");
                      } else {
                        setDeleteModal(chat._id);
                      }
                    }}
                  >
                    <Icon as={BsThreeDotsVertical} />
                  </Box>
                  {deleteModal === chat._id && (
                    <Box
                      position={"absolute"}
                      color={"red"}
                      bg={"#2D3748"}
                      right={10}
                      top={"50px"}
                      px={"16px"}
                      py={"6px"}
                      fontSize={"15px"}
                      zIndex={100}
                      borderRadius={"10rem 0rem 10rem 10rem"}
                      onClick={(e) =>
                        deleteChatHandler(chat._id, e, chat.isGroupChat)
                      }
                    >
                      <Text>Delete</Text>
                    </Box>
                  )}
                </Box>
              ))}
            </Stack>
          ) : (
            <Box
              bg="#E8E8E8"
              w="100%"
              display="flex"
              alignItems="center"
              color="black"
              px={3}
              py={3}
              mt={5}
              borderRadius="lg"
            >
              <Text>
                No chat created. Search user or create group for chat with other
                user.
              </Text>
            </Box>
          )
        ) : (
          isLoading && <ChatLoading />
        )}
      </Box>
    </Box>
  );
};

export default MyChats;
