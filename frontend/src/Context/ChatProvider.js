import React, { createContext, useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

const ChatContext = createContext();

const ChatProvider = ({ children }) => {
  const [selectedChat, setSelectedChat] = useState();
  const [user, setUser] = useState(null); // ✅ safer default
  const [notification, setNotification] = useState([]);
  const [chats, setChats] = useState([]); // ✅ safer default

  const history = useHistory();

  useEffect(() => {
    let userInfo = null;

    try {
      userInfo = JSON.parse(localStorage.getItem("userInfo"));
    } catch (err) {
      console.error("Invalid userInfo in localStorage");
      localStorage.removeItem("userInfo");
    }

    setUser(userInfo);

    if (!userInfo) {
      history.push("/");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ChatContext.Provider
      value={{
        selectedChat,
        setSelectedChat,
        user,
        setUser,
        notification,
        setNotification,
        chats,
        setChats,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const ChatState = () => {
  return useContext(ChatContext);
};

export default ChatProvider;
