import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { makeRequest } from "../../utils/axios";
import { useNavigate } from "react-router-dom";
import { UserState } from "../../context/userContext";

const Login = () => {
  const [inputs, setInputs] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showHide, setShowHide] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const ctx = UserState();

  /*==================== INPUT HANDLER ====================== */

  const showHidePasswordHandler = () => {
    setShowHide((prevState) => !prevState);
  };

  const inputsChangeHandler = (e) => {
    const { name, value } = e.target;
    setInputs((prevState) => ({ ...prevState, [name]: value }));
  };

  /*==================== SUBMIT FORM HANDLER =================== */

  const submitLoginHandler = async (event) => {
    try {
      event.preventDefault();

      if (!inputs.password || !inputs.confirmPassword || !inputs.email) {
        toast({
          title: "Please enter all required credentials.",
          description: "Email, password and confirm password are required.",
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

      setIsLoading(true);

      const res = await makeRequest.post("/auth/login", {
        email: inputs.email,
        password: inputs.password,
      });

      if (res.data) {
        toast({
          title: "Welcome Again.",
          description: "Enjoy chatting with Baate.",
          status: "success",
          duration: 5000,
          isClosable: true,
          position: "top",
        });
        localStorage.setItem("userInfo", JSON.stringify(res.data));
        ctx?.setId(res.data.userId);
        navigate("/chats", { replace: true });
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VStack spacing={"16px"}>
      <FormControl id="loginEmail" isRequired>
        <FormLabel>Email</FormLabel>
        <Input
          placeholder="Enter your email..."
          type="email"
          onChange={inputsChangeHandler}
          value={inputs.email}
          name="email"
        />
      </FormControl>
      <FormControl id="loginPassword" isRequired>
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
      <FormControl id="loginConfirmPassword" isRequired>
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
        onClick={submitLoginHandler}
        isLoading={isLoading}
      >
        Login
      </Button>
      <Box
        mt={"12px"}
        textDecoration={"underline"}
        color={"blue"}
        cursor={"pointer"}
        onClick={() =>
          setInputs({
            email: "guestUser@gmail.com",
            password: "guest123",
            confirmPassword: "guest123",
          })
        }
      >
        Login As Guest User
      </Box>
    </VStack>
  );
};

export default Login;
