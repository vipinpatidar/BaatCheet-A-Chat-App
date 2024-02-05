import {
  Box,
  Button,
  FormControl,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { FaEye } from "react-icons/fa6";
import { ChatState } from "../../context/chatContext";
import UserBadgeItem from "../UsersItems/UserBadgeItem";
import UserListItem from "../UsersItems/UserListItem";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../../utils/axios";

const UpdateGroupStateModal = ({ user }) => {
  const [groupName, setGroupName] = useState("");

  const [search, setSearch] = useState("");
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { selectedChat, setSelectedChat } = ChatState();

  /*================= GET SEARCHED USERS ================== */

  const { isLoading, data: users } = useQuery({
    queryKey: ["users", search],
    queryFn: async () => {
      const res = await makeRequest(`/user/allUsers?search=${search}`);
      return res.data;
    },
    enabled: !!search,
  });

  /*================= CREATE A GROUP ================== */

  const { mutate, isPending } = useMutation({
    mutationFn: (groupData) => {
      if (groupData.type === "rename") {
        return makeRequest.put(`/chat/renameGroup`, groupData);
      } else if (groupData.type === "addUser") {
        return makeRequest.put(`/chat/addToGroup`, groupData);
      } else if (groupData.type === "removeUser") {
        return makeRequest.put(`/chat/removeFromGroup`, groupData);
      } else if (groupData.type === "leaveGroup") {
        return makeRequest.put(`/chat/leaveGroup`, groupData);
      }
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
    onSuccess: (response, groupData) => {
      // console.log(groupData);
      // console.log(response);

      if (
        response.data &&
        (groupData.type === "removeUser" || groupData.type === "leaveGroup") &&
        groupData.participantId === user._id
      ) {
        setSelectedChat();
        onClose();
      } else if (response.data) {
        setSelectedChat(response.data);
      }

      queryClient.invalidateQueries({
        queryKey: ["chats"],
      });
    },
  });

  /*================= RENAME GROUP ================== */

  const renameGroupNameHandler = () => {
    if (!groupName) return;

    if (selectedChat.groupAdmin._id !== user._id) {
      toast({
        title: "Only admin can rename group name!",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    mutate({
      type: "rename",
      groupId: selectedChat._id,
      groupName: groupName,
    });
  };

  /*================= ADD USERS TO GROUP ================== */

  const addUserToGroupHandler = async (userToAdd) => {
    if (selectedChat.users.find((user) => user._id === userToAdd._id)) {
      toast({
        title: "User already added",
        description: "This user has already been added. Search Others.",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    if (selectedChat.groupAdmin._id !== user._id) {
      toast({
        title: "Only admins can add someone!",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      return;
    }
    mutate({
      type: "addUser",
      groupId: selectedChat._id,
      participantId: userToAdd._id,
    });
  };

  /*================= REMOVE USERS FROM GROUP ================== */

  const removeGroupUserHandler = async (addedUser) => {
    if (
      selectedChat.groupAdmin._id !== user._id &&
      addedUser._id !== user._id
    ) {
      toast({
        title: "Only admins can remove someone!",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      return;
    }
    mutate({
      type: "removeUser",
      groupId: selectedChat._id,
      participantId: addedUser._id,
    });
  };

  /*================= LEAVE GROUP ================== */

  const leaveGroupHandler = async (addedUser) => {
    mutate({
      type: "leaveGroup",
      groupId: selectedChat._id,
      participantId: addedUser._id,
    });
  };

  return (
    <>
      <Icon
        display={{ base: "flex" }}
        cursor={"pointer"}
        as={FaEye}
        onClick={onOpen}
      />

      <Modal onClose={onClose} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <ModalContent mx={"5px"}>
          <ModalHeader
            fontSize="35px"
            fontFamily="Work sans"
            display="flex"
            justifyContent="center"
          >
            {selectedChat.chatName}
          </ModalHeader>

          <ModalCloseButton />
          <ModalBody display="flex" flexDir="column" alignItems="center">
            <Box w="100%" display="flex" flexWrap="wrap" pb={3}>
              {selectedChat.users.map((user) => (
                <UserBadgeItem
                  key={user._id}
                  user={user}
                  admin={selectedChat.groupAdmin}
                  handleFunction={() => removeGroupUserHandler(user)}
                />
              ))}
            </Box>
            <FormControl display="flex">
              <Input
                placeholder="Chat Name"
                mb={3}
                mr={2}
                defaultValue={selectedChat.chatName}
                onChange={(e) => setGroupName(e.target.value)}
              />
              <Button
                variant="solid"
                colorScheme="teal"
                ml={1}
                isLoading={isPending}
                onClick={renameGroupNameHandler}
              >
                Update
              </Button>
            </FormControl>
            <FormControl>
              <Input
                placeholder="Add User to group"
                mb={1}
                onChange={(e) => setSearch(e.target.value)}
                type="search"
              />
            </FormControl>

            {isLoading || isPending ? (
              <Spinner mx="auto" display="flex" />
            ) : users?.length > 0 ? (
              users?.map((user) => (
                <UserListItem
                  key={user._id}
                  user={user}
                  handleFunction={() => addUserToGroupHandler(user)}
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
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => leaveGroupHandler(user)} colorScheme="red">
              Leave Group
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UpdateGroupStateModal;
