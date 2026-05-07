import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { SongContext } from "./SongContext";
export const SocketContext = createContext();

export const SocketContextState = ({ children }) => {
  const { __URL__ } = useContext(SongContext);
  const socketRef  = useRef(null);
  const onlineRef  = useRef(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [connected, setConnected]     = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io(__URL__, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("get_online");
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("presence", ({ userId, online }) => {
      const next = new Set(onlineRef.current);
      online ? next.add(String(userId)) : next.delete(String(userId));
      onlineRef.current = next;
      setOnlineUsers(new Set(next));
    });

    socket.on("online_list", (ids) => {
      const next = new Set(ids.map(String));
      onlineRef.current = next;
      setOnlineUsers(new Set(next));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [__URL__]);

  const joinConversation  = useCallback((id) => socketRef.current?.emit("join",  id), []);
  const leaveConversation = useCallback((id) => socketRef.current?.emit("leave", id), []);
  const sendMessage       = useCallback((data, cb) => socketRef.current?.emit("message", data, cb), []);
  const emitTyping        = useCallback((convId) => socketRef.current?.emit("typing",      { conversationId: convId }), []);
  const emitStopTyping    = useCallback((convId) => socketRef.current?.emit("stop_typing", { conversationId: convId }), []);

  const isOnline = useCallback((userId) => onlineRef.current.has(String(userId ?? "")), []);

  const onMessage    = useCallback((fn) => {
    const s = socketRef.current;
    if (!s) return () => {};
    s.on("message", fn);
    return () => s.off("message", fn);
  }, []);
  const onTyping     = useCallback((fn) => {
    const s = socketRef.current;
    if (!s) return () => {};
    s.on("typing", fn);
    return () => s.off("typing", fn);
  }, []);
  const onStopTyping = useCallback((fn) => {
    const s = socketRef.current;
    if (!s) return () => {};
    s.on("stop_typing", fn);
    return () => s.off("stop_typing", fn);
  }, []);

  return (
    <SocketContext.Provider value={{
      socket: socketRef, connected, isOnline,
      joinConversation, leaveConversation,
      sendMessage, emitTyping, emitStopTyping,
      onMessage, onTyping, onStopTyping,
    }}>
      {children}
    </SocketContext.Provider>
  );
};