import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import { createServer } from "http";
import { Server } from "socket.io";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import conn from "./config/db.js";

import authRoutes    from "./routes/authRoutes.js";
import songRoutes    from "./routes/songRoutes.js";
import playlistRoutes from "./routes/playlistRoutes.js";
import userRoutes    from "./routes/userRoutes.js";
import followRoutes  from "./routes/followRoutes.js";
import chatRoutes    from "./routes/chatRoutes.js";

dotenv.config();

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*", credentials: true }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/auth",     authRoutes);
app.use("/api/v1/song",     songRoutes);
app.use("/api/v1/playlist", playlistRoutes);
app.use("/api/v1/user",     userRoutes);
app.use("/api/v1/follow",   followRoutes);
app.use("/api/v1/chat",     chatRoutes);

// ── HTTP + Socket.io ─────────────────────────────────────────────────────────
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Authenticate socket using JWT in handshake
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("No token"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

// userId → Set<socketId>
const onlineUsers = new Map();

io.on("connection", (socket) => {
  const uid = socket.userId;
  if (!onlineUsers.has(uid)) onlineUsers.set(uid, new Set());
  onlineUsers.get(uid).add(socket.id);
  io.emit("presence", { userId: uid, online: true });

  // ── Join / leave conversation room ───────────────────────────────────────
  socket.on("join", (convId) => socket.join(convId));
  socket.on("leave", (convId) => socket.leave(convId));

  // ── Send message ─────────────────────────────────────────────────────────
  // type: "text" | "song" | "playlist"
  socket.on("message", async (data, ack) => {
    try {
      const db = conn.db("music_streaming");

      // Validate participant
      const conv = await db.collection("conversations").findOne({
        _id: new ObjectId(data.conversationId),
        participants: uid,
      });
      if (!conv) return ack?.({ error: "Unauthorized" });

      const msg = {
        conversationId: data.conversationId,
        senderId: uid,
        type: data.type || "text",
        text: data.text || "",
        song:     data.song     || null, // { title, artist, fileId, songId }
        playlist: data.playlist || null, // { playlistId, playlistName, songCount }
        sentAt: new Date(),
        read: false,
      };

      const { insertedId } = await db.collection("messages").insertOne(msg);

      // Summarise for lastMessage
      const preview =
        msg.type === "song"     ? `🎵 ${msg.song?.title}`
      : msg.type === "playlist" ? `🎵 ${msg.playlist?.playlistName}`
      : msg.text.slice(0, 60);

      await db.collection("conversations").updateOne(
        { _id: new ObjectId(data.conversationId) },
        { $set: { lastMessage: { preview, senderId: uid, sentAt: new Date() }, updatedAt: new Date() } }
      );

      const saved = { ...msg, _id: insertedId };
      io.to(data.conversationId).emit("message", saved);
      ack?.({ ok: true, _id: insertedId });
    } catch (err) {
      console.error("socket message:", err);
      ack?.({ error: err.message });
    }
  });

  // ── Typing ───────────────────────────────────────────────────────────────
  socket.on("typing",      ({ conversationId }) => socket.to(conversationId).emit("typing",      { userId: uid }));
  socket.on("stop_typing", ({ conversationId }) => socket.to(conversationId).emit("stop_typing", { userId: uid }));

  socket.on("disconnect", () => {
    const sockets = onlineUsers.get(uid);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineUsers.delete(uid);
        io.emit("presence", { userId: uid, online: false });
      }
    }
  });
});

export { io };

const PORT = 1337;
httpServer.listen(PORT, () =>
  console.log(`🚀 Server + Socket.io running at http://localhost:${PORT}`)
);