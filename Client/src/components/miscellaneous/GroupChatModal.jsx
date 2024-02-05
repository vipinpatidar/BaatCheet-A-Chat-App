import {
  Box,
  Button,
  FormControl,
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
import { useState } from "react";
import UserListItem from "../UsersItems/UserListItem";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../../utils/axios";
import UserBadgeItem from "../UsersItems/UserBadgeItem";

const GroupChatModal = ({ children, user }) => {
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [search, setSearch] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const queryClient = useQueryClient();

  /*================= GET SEARCHED USERS ================== */

  const { isLoading, data: users } = useQuery({
    queryKey: ["users", search],
    queryFn: async () => {
      const res = await makeRequest(`/user/allUsers?search=${search}`);
      return res.data;
    },
    enabled: !!search,
  });

  /*================= ADD USERS TO GROUP ================== */

  const addUserToGroupHandler = async (userToAdd) => {
    if (selectedUsers.includes(userToAdd)) {
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

    setSelectedUsers((prevState) => [...prevState, userToAdd]);
  };

  /*================= REMOVE USERS FROM GROUP ================== */

  const removeAddedUserHandler = async (addedUser) => {
    setSelectedUsers((prevState) =>
      prevState.filter((user) => user._id !== addedUser._id)
    );
  };

  /*================= CREATE A GROUP ================== */

  const { mutate } = useMutation({
    mutationFn: (groupData) => {
      return makeRequest.post(`/chat/createGroup`, groupData);
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

  const createGroupSubmitHandler = async () => {
    if (!groupName || !selectedUsers) {
      toast({
        title: "Please fill all the felids",
        description: "Add group name and group members.",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    if (selectedUsers.length < 2) {
      toast({
        title: "Group should have 2 group members.",
        description: "Add more to group or chat One To One.",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    mutate({
      groupName: groupName,
      groupMembers: selectedUsers,
    });
    onClose();
    setSearch("");
    setSelectedUsers([]);
  };

  return (
    <>
      <span onClick={onOpen}>{children}</span>

      <Modal
        onClose={() => {
          onClose();
          setSearch("");
          setSelectedUsers([]);
        }}
        isOpen={isOpen}
        isCentered
      >
        <ModalOverlay />
        <ModalContent mx={"5px"}>
          <ModalHeader
            fontSize="30px"
            fontFamily="Work sans"
            display="flex"
            justifyContent="center"
          >
            Create Group Chat
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody d="flex" flexDir="column" alignItems="center">
            <FormControl>
              <Input
                placeholder="Group Name"
                mb={3}
                onChange={(e) => setGroupName(e.target.value)}
                type="search"
              />
            </FormControl>
            <FormControl>
              <Input
                placeholder="Add Users eg: vipin, Kalia, Jane"
                mb={1}
                onChange={(e) => setSearch(e.target.value)}
                type="search"
              />
            </FormControl>
            <Box w="100%" display="flex" flexWrap="wrap">
              {selectedUsers.map((u) => (
                <UserBadgeItem
                  key={u._id}
                  user={u}
                  handleFunction={() => removeAddedUserHandler(u)}
                  admin={user}
                />
              ))}
            </Box>
            {isLoading ? (
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
            <Button onClick={createGroupSubmitHandler} colorScheme="blue">
              Create Chat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default GroupChatModal;
