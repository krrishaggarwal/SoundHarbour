import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { SongContext } from "./SongContext";

export const SocketContext = createContext();

export const SocketContextState = ({ children }) => {
  const { __URL__ } = useContext(SongContext);
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io(__URL__, {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("presence", ({ userId, online }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        online ? next.add(userId) : next.delete(userId);
        return next;
      });
    });

    return () => socket.disconnect();
  }, [__URL__]);

  const isOnline = (userId) => onlineUsers.has(userId);

  const joinConversation  = (id) => socketRef.current?.emit("join", id);
  const leaveConversation = (id) => socketRef.current?.emit("leave", id);

  const sendMessage = (data, cb) => socketRef.current?.emit("message", data, cb);

  const emitTyping     = (convId) => socketRef.current?.emit("typing",      { conversationId: convId });
  const emitStopTyping = (convId) => socketRef.current?.emit("stop_typing", { conversationId: convId });

  const onMessage    = (fn) => { socketRef.current?.on("message", fn);      return () => socketRef.current?.off("message", fn); };
  const onTyping     = (fn) => { socketRef.current?.on("typing", fn);       return () => socketRef.current?.off("typing", fn); };
  const onStopTyping = (fn) => { socketRef.current?.on("stop_typing", fn);  return () => socketRef.current?.off("stop_typing", fn); };

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current, connected, isOnline,
      joinConversation, leaveConversation,
      sendMessage, emitTyping, emitStopTyping,
      onMessage, onTyping, onStopTyping,
    }}>
      {children}
    </SocketContext.Provider>
  );
};