import { createContext, useContext, useState } from "react";

const ChatContext = createContext({
  selectedChat: {},
  setSelectedChat: () => {},
  unreadMessages: [],
  setUnreadMessages: () => {},
  notifications: [],
  setNotifications: () => {},
});

const ChatState = () => {
  return useContext(ChatContext);
};

const ChatContextProvider = ({ children }) => {
  const [selectedChat, setSelectedChat] = useState();
  const [unreadMessages, setUnreadMessages] = useState([]);

  const [notifications, setNotifications] = useState([]);

  // console.log(chats);

  const context = {
    selectedChat,
    setSelectedChat,
    notifications,
    setNotifications,
    unreadMessages,
    setUnreadMessages,
  };

  return (
    <ChatContext.Provider value={context}>{children}</ChatContext.Provider>
  );
};

export { ChatContextProvider, ChatContext, ChatState };
