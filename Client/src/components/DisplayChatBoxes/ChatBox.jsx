import { Box } from "@chakra-ui/react";
import { ChatState } from "../../context/chatContext";
import Chat from "../Chats/Chat";

const ChatBox = ({ bg, color, user }) => {
  const { selectedChat } = ChatState();
  return (
    <Box
      bg={bg}
      color={color}
      display={{ base: selectedChat ? "flex" : "none", lg: "flex" }}
      alignItems="center"
      flexDir="column"
      p={3}
      w={{ base: "100%", lg: "68.5%" }}
      h={"100%"}
      borderRadius="lg"
      borderWidth="1px"
    >
      <Chat user={user} bg={bg} color={color} />
    </Box>
  );
};

export default ChatBox;
