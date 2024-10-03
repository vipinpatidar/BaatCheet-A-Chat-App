import {
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Textarea,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { makeRequest } from "../../utils/axios";
import { useNavigate } from "react-router-dom";
import { UserState } from "../../context/userContext";
import useImageUploader from "../../hooks/useImageUploader";

const Signup = () => {
  const [inputs, setInputs] = useState({
    name: "",
    status: "",
    email: "",
    password: "",
    confirmPassword: "",
    image: "",
  });

  const [showHide, setShowHide] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();
  const ctx = UserState();

  const isImageObj =
    typeof inputs.image === "object" &&
    inputs.image !== null &&
    !Array.isArray(inputs.image);

  const [isLoading, getUploadedImg] = useImageUploader();

  const inputsChangeHandler = (event) => {
    const { name, value } = event.target;
    setInputs((prevState) => ({ ...prevState, [name]: value }));
  };

  const showHidePasswordHandler = () => {
    setShowHide((prevState) => !prevState);
  };

  /*==================== POST REQUEST ====================== */

  const submitUserData = async (userData) => {
    try {
      const res = await makeRequest.post("/auth/signup", userData);

      if (res.data) {
        toast({
          title: "Account created successfully.",
          description: "Enjoy chatting with Baatcheet.",
          status: "success",
          duration: 5000,
          isClosable: true,
          position: "top",
        });
        localStorage.setItem("userInfo", JSON.stringify(res.data));
        ctx.setId(res.data.userId);

        navigate("/chats", { replace: true });
        // window.location.reload();
      }
    } catch (error) {
      console.log(error);
      const message = error.response.data.message || "Something went wrong.";

      toast({
        title: "Error Occured!",
        description: message,
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top",
      });
    }
  };

  const submitSignUpHandler = async (event) => {
    try {
      event.preventDefault();

      if (
        !inputs.password ||
        !inputs.confirmPassword ||
        !inputs.name ||
        !inputs.email
      ) {
        toast({
          title: "Please enter all required credentials.",
          description:
            "name, email, password and confirm password are required.",
          status: "error",
          duration: 4000,
          isClosable: true,
          position: "top",
        });
        return;
      }

      if (inputs.password !== inputs.confirmPassword) {
        toast({
          title: "Password confirmation failed.",
          description:
            "Please check your password and confirm your password again.",
          status: "error",
          duration: 4000,
          isClosable: true,
          position: "top",
        });
        return;
      }

      let userData;

      if (isImageObj) {
        const uploadedImgPromise = getUploadedImg(inputs.image);

        uploadedImgPromise
          .then(async (UploadedImg) => {
            if (UploadedImg) {
              userData = {
                name: inputs.name,
                email: inputs.email,
                password: inputs.password,
                status: inputs.status,
                image: UploadedImg,
              };

              await submitUserData(userData);
            } else {
              return;
            }
          })
          .catch((error) => {
            console.log(error);
            throw error;
          });
      } else {
        userData = {
          name: inputs.name,
          email: inputs.email,
          password: inputs.password,
          status: inputs.status,
        };

        await submitUserData(userData);
      }
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: error?.message || "Something went wrong",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top",
      });
    }
  };

  return (
    <VStack spacing={"16px"}>
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
            {inputs.image && (
              <img
                src={inputs.image && URL.createObjectURL(inputs.image)}
                alt="image"
                style={{ border: "1px solid red" }}
              />
            )}
          </InputRightElement>
        </InputGroup>
      </FormControl>
      <FormControl id="name" isRequired>
        <FormLabel>Name</FormLabel>
        <Input
          placeholder="Enter your name..."
          onChange={inputsChangeHandler}
          value={inputs.name}
          name="name"
        />
      </FormControl>
      <FormControl id="Status">
        <FormLabel>Bio / Status</FormLabel>
        <Textarea
          placeholder="Your Bio or Status.."
          onChange={inputsChangeHandler}
          value={inputs.status}
          name="status"
          resize={"none"}
        />
      </FormControl>
      <FormControl id="email" isRequired>
        <FormLabel>Email</FormLabel>
        <Input
          placeholder="Enter your email..."
          type="email"
          onChange={inputsChangeHandler}
          value={inputs.email}
          name="email"
        />
      </FormControl>
      <FormControl id="password" isRequired>
        <FormLabel>Password</FormLabel>
        <InputGroup>
          <Input
            placeholder="Enter your password..."
            onChange={inputsChangeHandler}
            value={inputs.password}
            type={showHide ? "text" : "password"}
            name="password"
          />
          <InputRightElement w={"4.5rem"}>
            <Button h={"1.75rem"} size={"sm"} onClick={showHidePasswordHandler}>
              {showHide ? "Hide" : "Show"}
            </Button>
          </InputRightElement>
        </InputGroup>
      </FormControl>
      <FormControl id="confirmPassword" isRequired>
        <FormLabel>Confirm Password</FormLabel>
        <InputGroup>
          <Input
            placeholder="Enter your password..."
            onChange={inputsChangeHandler}
            value={inputs.confirmPassword}
            type={showHide ? "text" : "password"}
            name="confirmPassword"
          />
          <InputRightElement w={"4.5rem"}>
            <Button h={"1.75rem"} size={"sm"} onClick={showHidePasswordHandler}>
              {showHide ? "Hide" : "Show"}
            </Button>
          </InputRightElement>
        </InputGroup>
      </FormControl>
      <Button
        colorScheme="blue"
        width={"100%"}
        mt={"15px"}
        onClick={submitSignUpHandler}
        isLoading={isLoading}
      >
        Sign Up
      </Button>
    </VStack>
  );
};

export default Signup;
