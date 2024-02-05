import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Text,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  MenuDivider,
  Icon,
  useColorMode,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Input,
  useDisclosure,
  useToast,
  DrawerCloseButton,
  Spinner,
} from "@chakra-ui/react";
import { RiUserSearchFill, RiArrowDownSLine } from "react-icons/ri";
import { FaBell, FaSun, FaMoon } from "react-icons/fa6";
import ProfileModal from "./ProfileModel";
import { UserState } from "../../context/userContext";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../utils/axios";
import ChatLoading from "../ChatLoading";
import UserListItem from "../UsersItems/UserListItem";
import { ChatState } from "../../context/chatContext";
import { getSender } from "../../config/ChatLogics";

const SearchSlider = ({ user, bg, color }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const [search, setSearch] = useState("");
  const { setId } = UserState();
  const { setSelectedChat, notifications, setNotifications } = ChatState();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const queryClient = useQueryClient();

  /*================= SEARCH SUBMIT HANDLER ================== */

  const {
    isLoading,
    data: users,
    refetch,
  } = useQuery({
    queryKey: ["users", search],
    queryFn: async () => {
      const res = await makeRequest(`/user/allUsers?search=${search}`);
      return res.data;
    },
    enabled: false,
  });

  // console.log(users);

  const searchSubmitHandler = (e) => {
    try {
      e.preventDefault();

      if (!search) {
        toast({
          title: "Please Enter something in search",
          status: "warning",
          duration: 5000,
          isClosable: true,
          position: "top",
        });
        return;
      }

      // on click refetch;
      refetch();
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Search Results",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }
  };

  /*================= GET CHAT SEARCHED USER ================== */

  const { mutate, data, isPending } = useMutation({
    mutationFn: (userId) => {
      return makeRequest.post(`/chat/createChat`, { receiverId: userId });
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chats"],
      });
    },
  });

  // console.log(data?.data);

  //Passing data to Chat context
  useEffect(() => {
    if (!isPending) {
      setSelectedChat(data?.data);
    }
  }, [data, setSelectedChat, isPending]);

  const accessChat = (userId) => {
    // console.log(userId);
    mutate(userId);
    onClose();
  };

  /*===================== LOGOUT HANDLER ===================== */

  const logoutHandler = () => {
    setId(null);
    localStorage.removeItem("userInfo");
    navigate("/");
  };

  return (
    <Box mx={{ base: "5px", md: "8px" }} mt={{ base: "5px", md: "8px" }}>
      <Box
        display={"flex"}
        justifyContent="space-between"
        alignItems="center"
        w="100%"
        p="10px"
        py={"13px"}
        bg={bg}
        color={color}
      >
        <Tooltip label="Search Users to chat" hasArrow placement="bottom-end">
          <Button variant={"ghost"} onClick={onOpen} px={{ base: "4px" }}>
            <Icon fontSize="xl" as={RiUserSearchFill} />
            <Text display={{ base: "none", md: "flex" }} px={"6"} py={"4"}>
              Search User
            </Text>
          </Button>
        </Tooltip>
        <Text
          fontSize={{ base: "xl", md: "2xl" }}
          fontFamily="Work sans"
          textAlign={{ base: "left", lg: "center" }}
          order={{ base: -1, lg: 0 }}
          ml={{ base: 2, lg: 4 }}
          flex={1}
          textTransform={"uppercase"}
        >
          BaatCheet
        </Text>
        <Box display={"flex"} alignItems={"center"} justifyContent={"center"}>
          <Menu
            display={"flex"}
            alignItems={"center"}
            justifyContent={"center"}
          >
            <Button
              display={"flex"}
              alignItems={"center"}
              justifyContent={"center"}
              mr={{ base: 1, md: 2 }}
              onClick={toggleColorMode}
              bg="none"
              _hover={{ bg: "none" }}
            >
              <Icon
                fontSize={"xl"}
                as={colorMode === "light" ? FaMoon : FaSun}
              />
            </Button>
            <MenuButton
              display={"flex"}
              alignItems={"center"}
              justifyContent={"center"}
              mr={{ base: 4, md: 7 }}
              position={"relative"}
            >
              <Box
                position={"absolute"}
                bg={"#F94A29"}
                color={"#fff"}
                px={1.5}
                py={0}
                borderRadius={"full"}
                top={-2}
                right={-2}
                fontSize={"14px"}
              >
                {notifications.length}
              </Box>
              <Icon fontSize={"xl"} mt={1} as={FaBell} />
            </MenuButton>
            <MenuList pl={2}>
              {!notifications.length && "No New Messages"}
              {notifications.map((notification) => (
                <MenuItem
                  pl={0}
                  key={notification._id}
                  onClick={() => {
                    setSelectedChat(notification.chat);
                    setNotifications(
                      notifications.filter((n) => n._id !== notification._id)
                    );
                  }}
                >
                  {notification.chat.isGroupChat
                    ? `New Message in ${notification.chat.chatName}`
                    : `New Message from ${getSender(
                        user,
                        notification.chat.users
                      )}`}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<Icon fontSize={"2xl"} as={RiArrowDownSLine} />}
              py={4}
            >
              <Avatar
                size="sm"
                cursor="pointer"
                name={user.name}
                src={user.image}
              />
            </MenuButton>
            <MenuList>
              <ProfileModal user={user} isProfile={true}>
                <MenuItem>Profile</MenuItem>
              </ProfileModal>
              <MenuDivider />
              <MenuItem onClick={logoutHandler}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </Box>
      </Box>

      {/* Search Slider */}

      <Drawer
        placement="left"
        onClose={() => {
          onClose();
          setSearch("");
        }}
        isOpen={isOpen}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Search Users</DrawerHeader>
          <DrawerBody px={3}>
            <Box display="flex" pb={2} mt={2}>
              <Input
                placeholder="Enter name or email"
                mr={2}
                value={search}
                type="search"
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button onClick={searchSubmitHandler}>Go</Button>
            </Box>
            {isLoading ? (
              <ChatLoading />
            ) : users?.length > 0 ? (
              users?.map((user) => (
                <UserListItem
                  key={user._id}
                  user={user}
                  handleFunction={() => accessChat(user._id)}
                />
              ))
            ) : (
              users && (
                <Box
                  bg="#E8E8E8"
                  w="100%"
                  display="flex"
                  alignItems="center"
                  color="black"
                  px={3}
                  py={2}
                  mt={5}
                  borderRadius="lg"
                >
                  <Text>No user found with this search.</Text>
                </Box>
              )
            )}
            {isPending && <Spinner ml="auto" display="flex" />}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default SearchSlider;
