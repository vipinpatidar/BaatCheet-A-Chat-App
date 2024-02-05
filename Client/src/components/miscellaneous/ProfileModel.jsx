import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  Text,
  Image,
  Icon,
  useToast,
  Box,
} from "@chakra-ui/react";
import { FaEye } from "react-icons/fa6";
import { UserState } from "../../context/userContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../../utils/axios";
import UpdateProfileModal from "./UpdateProfileModal";

const ProfileModal = ({ user, children, isProfile }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  // console.log(user);
  const loggedInUser = UserState();
  const queryClient = useQueryClient();
  const toast = useToast();

  // console.log(loggedInUser);

  const { mutate } = useMutation({
    mutationFn: async (data) => {
      if (data.type === "block") {
        return makeRequest.post("/user/blockUser", data);
      } else if (data.type === "unblock") {
        return makeRequest.post("/user/unblockUser", data);
      }
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user", loggedInUser._id],
      });
    },
  });

  const blockUserHandler = (userId) => {
    console.log("clicked");
    mutate({
      userId: userId,
      type: "block",
    });
  };

  const unblockUserHandler = (userId) => {
    mutate({
      userId: userId,
      type: "unblock",
    });
  };

  return (
    <>
      {children ? (
        <span onClick={onOpen}>{children}</span>
      ) : (
        <Icon
          display={{ base: "flex" }}
          fontSize={"2xl"}
          as={FaEye}
          cursor={"pointer"}
          onClick={onOpen}
        />
      )}
      <Modal onClose={onClose} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <ModalContent mx={"5px"}>
          <ModalHeader
            fontSize="28px"
            fontFamily="Work sans"
            display="flex"
            justifyContent="center"
            pb={2}
          >
            {user.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody
            display="flex"
            flexDir="column"
            alignItems="center"
            justifyContent="space-between"
          >
            <Image
              borderRadius="full"
              boxSize="120px"
              src={user.image}
              alt={user.name}
              mb={4}
            />

            <Box
              fontFamily="Work sans"
              display={"flex"}
              gap={2}
              alignItems={"center"}
            >
              <Text fontSize={{ base: "22px", md: "22px" }}>Email:</Text>
              <Text fontSize={{ base: "18px", md: "18px" }}>{user.email}</Text>
            </Box>
            <Box
              fontFamily="Work sans"
              display={"flex"}
              mt={1}
              gap={2}
              mx={"auto"}
            >
              <Text fontSize={{ base: "22px", md: "22px" }}>Status:</Text>
              <Text fontSize={{ base: "18px", md: "18px" }} mt={1}>
                {user.status}
              </Text>
            </Box>
          </ModalBody>
          <ModalFooter
            display={"flex"}
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            {!isProfile ? (
              !loggedInUser.blockedUsers.includes(user._id) ? (
                <Button
                  bg={"#D04848"}
                  _hover={{ bg: "#d55a5a" }}
                  color={"#fff"}
                  onClick={() => blockUserHandler(user._id)}
                >
                  Block
                </Button>
              ) : (
                <Button
                  bg={"#F037A5"}
                  _hover={{ bg: "#F037A5" }}
                  color={"#fff"}
                  onClick={() => unblockUserHandler(user._id)}
                >
                  Unblock
                </Button>
              )
            ) : (
              <UpdateProfileModal user={user}>
                <Button
                  bg={"#6962AD"}
                  _hover={{ bg: "#6954af" }}
                  color={"#fff"}
                >
                  Update
                </Button>
              </UpdateProfileModal>
            )}
            <Button ml={"auto"} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ProfileModal;
