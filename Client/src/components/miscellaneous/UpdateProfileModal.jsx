import { useState } from "react";

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
  useToast,
  Input,
  VStack,
  FormControl,
  FormLabel,
  InputGroup,
  InputRightElement,
  Textarea,
} from "@chakra-ui/react";
import useImageUploader from "../../hooks/useImageUploader";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../../utils/axios";

const UpdateProfileModal = ({ children, user }) => {
  const [inputs, setInputs] = useState({
    name: user.name,
    status: user.status,
    password: "",
    image: user.image,
  });

  const [showHide, setShowHide] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [isLoading, getUploadedImg] = useImageUploader();

  const isImageObj =
    typeof inputs.image === "object" &&
    inputs.image !== null &&
    !Array.isArray(inputs.image);

  const showHidePasswordHandler = () => {
    setShowHide((prevState) => !prevState);
  };

  const inputsChangeHandler = (event) => {
    const { name, value } = event.target;
    setInputs((prevState) => ({ ...prevState, [name]: value }));
  };

  /*=================== Update user profile ==================== */

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => {
      return makeRequest.put("/user/updateProfile", data);
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
      if (inputs.password !== "") {
        toast({
          title: "password changed.",
          description: "Your password changed successfully.",
          status: "success",
          duration: 4000,
          isClosable: true,
          position: "top",
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["user", user._id],
      });
      queryClient.invalidateQueries({
        queryKey: ["chats"],
      });
    },
  });

  const updateProfileHandler = () => {
    if (inputs.name.length === 0) {
      toast({
        title: "Name is required.",
        description: "Please enter your name.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });

      return;
    }

    if (isImageObj) {
      const uploadedImgPromise = getUploadedImg(inputs.image);

      uploadedImgPromise
        .then((UploadedImg) => {
          if (UploadedImg) {
            mutate({
              name: inputs.name,
              status: inputs.status,
              image: UploadedImg,
              password: inputs.password,
            });
            onClose();
          } else {
            return;
          }
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      mutate({
        name: inputs.name,
        status: inputs.status,
        image: inputs.image,
        password: inputs.password,
      });
      onClose();
    }
  };

  return (
    <>
      {children && <span onClick={onOpen}>{children}</span>}
      <Modal onClose={onClose} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <ModalContent mx={"5px"}>
          <ModalHeader
            fontSize="30px"
            fontFamily="Work sans"
            display="flex"
            justifyContent="center"
            pb={2}
          >
            Update Profile
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody
            display="flex"
            flexDir="column"
            alignItems="center"
            justifyContent="space-between"
          >
            <VStack width={"100%"} spacing={"12px"}>
              <FormControl id="image">
                <FormLabel>Profile Image</FormLabel>
                <InputGroup>
                  <Input
                    placeholder="Select Profile Image"
                    type="file"
                    p={1.5}
                    accept="image/*"
                    onChange={(e) => {
                      setInputs((prevState) => ({
                        ...prevState,
                        image: e.target.files[0],
                      }));
                    }}
                  />
                  <InputRightElement w={"4.5rem"} mr={2}>
                    <img
                      src={
                        isImageObj
                          ? URL.createObjectURL(inputs.image)
                          : inputs.image
                      }
                      alt="image"
                      style={{ border: "1px solid red" }}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              <FormControl id="name" isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  placeholder="Enter your name..."
                  name="name"
                  onChange={inputsChangeHandler}
                  value={inputs.name}
                />
              </FormControl>
              <FormControl id="Status">
                <FormLabel>Bio / Status</FormLabel>

                <Textarea
                  placeholder="Your Bio or Status.."
                  name="status"
                  resize={"none"}
                  onChange={inputsChangeHandler}
                  value={inputs.status}
                />
              </FormControl>
              <FormControl id="password">
                <FormLabel>Change Password</FormLabel>
                <InputGroup>
                  <Input
                    placeholder="Enter your password..."
                    type={showHide ? "text" : "password"}
                    name="password"
                    onChange={inputsChangeHandler}
                    value={inputs.password}
                  />
                  <InputRightElement w={"4.5rem"}>
                    <Button
                      h={"1.75rem"}
                      size={"sm"}
                      onClick={showHidePasswordHandler}
                    >
                      {showHide ? "Hide" : "Show"}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter
            display={"flex"}
            alignItems={"center"}
            justifyContent={"space-between"}
            mt={"18px"}
          >
            <Button
              bg={"#54BAB9"}
              _hover={{ bg: "#24A19C" }}
              color={"#fff"}
              onClick={updateProfileHandler}
              isLoading={isLoading || isPending}
            >
              Update Profile
            </Button>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UpdateProfileModal;
