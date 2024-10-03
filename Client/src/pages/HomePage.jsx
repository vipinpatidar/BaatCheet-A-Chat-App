import {
  Box,
  Container,
  Text,
  Tabs,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
} from "@chakra-ui/react";
import useColorModes from "../hooks/useColorModes";
import Login from "../components/Authentication/Login";
import Signup from "../components/Authentication/Signup";

const HomePage = () => {
  const [bg, color] = useColorModes();

  return (
    <Container pb={4}>
      <Box
        w={"100%"}
        m="30px 0 15px 0"
        display={"flex"}
        bg={bg}
        color={color}
        justifyContent={"center"}
        borderRadius={"lg"}
        p={3}
      >
        <Text
          fontSize={"2xl"}
          fontFamily={"Work sans"}
          color={color}
          textTransform={"uppercase"}
        >
          BaatCheet
        </Text>
      </Box>

      <Box bg={bg} w={"100%"} p={3} borderRadius={"lg"}>
        <Tabs variant="soft-rounded">
          <TabList mb="1rem">
            <Tab width={"50%"} py="10px" color={color} mr="4px">
              Login
            </Tab>
            <Tab width={"50%"} py="10px" color={color}>
              Sign Up
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Login />
            </TabPanel>
            <TabPanel>
              <Signup />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
};

export default HomePage;
