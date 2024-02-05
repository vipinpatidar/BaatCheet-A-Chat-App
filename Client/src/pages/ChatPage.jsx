import ChatBox from "../components/DisplayChatBoxes/ChatBox";
import MyChats from "../components/DisplayChatBoxes/MyChats";
import SearchSlider from "../components/miscellaneous/SearchSlider";
import { UserState } from "../context/userContext";
import { Box } from "@chakra-ui/react";
import useColorModes from "../hooks/useColorModes";

const ChatPage = () => {
  const user = UserState();

  const [bg, color] = useColorModes();

  return (
    <Box style={{ width: "100%" }}>
      {user && <SearchSlider user={user} bg={bg} color={color} />}

      <Box
        display={"flex"}
        w={"100%"}
        p={{ base: "5px", md: "8px" }}
        alignItems={"center"}
        justifyContent={"space-between"}
        height={{ base: "calc(100dvh - 71px)", md: "calc(100vh - 74px)" }}
      >
        {user && <MyChats user={user} bg={bg} color={color} />}
        {user && <ChatBox user={user} bg={bg} color={color} />}
      </Box>
    </Box>
  );
};

export default ChatPage;
