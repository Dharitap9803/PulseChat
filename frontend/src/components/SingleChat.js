import React, { useState, useEffect, useCallback } from "react"; 
import { FormControl } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Box, Text, Progress } from "@chakra-ui/react";
import {
  IconButton,
  Spinner,
  useToast,
  Button,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { MdSend, MdEmojiEmotions } from "react-icons/md";

import { getSender, getSenderFull } from "../config/ChatLogics";
import axios from "axios";
import io from "socket.io-client";
import ProfileModal from "./miscellaneous/ProfileModal";
import ScrollableChat from "./ScrollableChat";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import { ChatState } from "../Context/ChatProvider";

import Lottie from "react-lottie";
import animationData from "../animations/typing.json";
import EmojiPicker from "emoji-picker-react";

import "./styles.css";

/* ✅ FIXED ENDPOINT */
const ENDPOINT =
  process.env.NODE_ENV === "production"
    ? "https://pulsechat-xalu.onrender.com"
    : "http://localhost:5001";
let socket;
let selectedChatCompare;

/* ✅ ADDITION: max file size */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  /* ✅ ADDITION */
  const [uploadProgress, setUploadProgress] = useState(0);

  const toast = useToast();

  const {
    selectedChat,
    setSelectedChat,
    user,
    notification,
    setNotification,
  } = ChatState();

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData,
    rendererSettings: { preserveAspectRatio: "xMidYMid slice" },
  };

  const fetchMessages = useCallback(async () => {
    if (!selectedChat || !user) return;

    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };

      setLoading(true);
      const { data } = await axios.get(
        `${ENDPOINT}/api/message/${selectedChat._id}`,
        config
      );

      setMessages(data);
      setLoading(false);

      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      toast({
        title: "Failed to load messages",
        status: "error",
        duration: 3000,
      });
    }
  }, [selectedChat, user, toast]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    socket.emit("stop typing", selectedChat._id);

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const content = newMessage;
      setNewMessage("");

      const { data } = await axios.post(
        `${ENDPOINT}/api/message`,
        {
          content,
          chatId: selectedChat._id,
        },
        config
      );

      socket.emit("new message", data);
      setMessages((prev) => [...prev, data]);
    } catch (error) {
      toast({
        title: "Message not sent",
        status: "error",
        duration: 3000,
      });
    }
  };

  const onEmojiClick = (emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  useEffect(() => {
  if (!user) return;

  socket = io(ENDPOINT);
  socket.emit("setup", user);

  socket.on("typing", () => setIsTyping(true));
  socket.on("stop typing", () => setIsTyping(false));

  return () => {
    socket.disconnect(); // ✅ ADD THIS
  };
}, [user]);

  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
  }, [selectedChat, fetchMessages]);

  useEffect(() => {
    if (!socket) return;

    socket.on("message recieved", (newMsg) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMsg.chat._id
      ) {
        setNotification((prev) => [newMsg, ...prev]);
        setFetchAgain(!fetchAgain);
      } else {
        setMessages((prev) => [...prev, newMsg]);
      }
    });
  }, [fetchAgain, setFetchAgain, setNotification]);

  return (
    <>
      {selectedChat ? (
        <>
          {/* 🔥 HEADER FIX APPLIED HERE */}
          <Box
            fontSize="xl"
            pb={3}
            px={2}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            w="100%"
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />

            {!selectedChat.isGroupChat ? (
              <>
                {getSender(user, selectedChat.users)}
                <ProfileModal
                  user={getSenderFull(user, selectedChat.users)}
                />
              </>
            ) : (
              <Box
                display="flex"
                w="100%"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text>{selectedChat.chatName.toUpperCase()}</Text>
                <UpdateGroupChatModal />
              </Box>
            )}
          </Box>

          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#E8E8E8"
            w="100%"
            h="100%"
            borderRadius="lg"
          >
            {loading ? (
              <Spinner size="xl" />
            ) : (
              <ScrollableChat messages={messages} />
            )}

            {uploadProgress > 0 && (
              <Progress value={uploadProgress} size="sm" mt={2} />
            )}

            <FormControl mt={3}>
              {isTyping && (
                <Lottie options={defaultOptions} width={70} />
              )}

              <Box
                display="flex"
                alignItems="center"
                bg="#E0E0E0"
                borderRadius="full"
                p={2}
              >
                <Input
                  variant="unstyled"
                  placeholder="Enter a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  mx={2}
                />

                <IconButton
                  icon={<MdEmojiEmotions />}
                  variant="ghost"
                  onClick={() => setShowEmoji((prev) => !prev)}
                />

                <Button
                  colorScheme="teal"
                  borderRadius="full"
                  onClick={sendMessage}
                >
                  <MdSend />
                </Button>
              </Box>

              {showEmoji && (
                <Box position="absolute" bottom="90px" right="20px">
                  <EmojiPicker onEmojiClick={onEmojiClick} />
                </Box>
              )}
            </FormControl>
          </Box>
        </>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
        >
          <Text fontSize="3xl">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
