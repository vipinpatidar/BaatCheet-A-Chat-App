import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
// import `ChakraProvider` component
import {
  ChakraProvider,
  extendTheme,
  ColorModeScript,
  createStandaloneToast,
} from "@chakra-ui/react";
import { BrowserRouter } from "react-router-dom";
import { UserContextProvider } from "./context/userContext";
import { ChatContextProvider } from "./context/chatContext";
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
} from "@tanstack/react-query";

const { ToastContainer, toast } = createStandaloneToast();

const themePreference = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const config = {
  initialColorMode: themePreference() ? "dark" : "light",
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
});

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.log(error.response.status === 403);

      if (query?.state?.data === undefined) {
        const err =
          error?.response?.data.message || "Opps! Something went wrong.";
        toast({
          title: "Error Occured!",
          description: err,
          status: "error",
          duration: 4000,
          isClosable: true,
          position: "top",
        });
      }
    },
  }),
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ChatContextProvider>
          <UserContextProvider>
            <ChakraProvider theme={theme}>
              <ColorModeScript
                initialColorMode={theme.config.initialColorMode}
              />
              <App />
              <ToastContainer />
            </ChakraProvider>
          </UserContextProvider>
        </ChatContextProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
