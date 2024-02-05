import { useColorModeValue } from "@chakra-ui/react";

const useColorModes = () => {
  const bg = useColorModeValue("white", "#242424");
  const color = useColorModeValue("#111", "#fff");

  return [bg, color];
};

export default useColorModes;
