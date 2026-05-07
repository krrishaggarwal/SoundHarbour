//chatController.js
import { ObjectId } from "mongodb";
import conn from "../config/db.js";

const db = () => conn.db("SoundHarbour");

export const getConversations = async (req, res) => {
  try {
    const convos = await db().collection("conversations")
      .find({ participants: req.userId })
      .sort({ updatedAt: -1 })
      .toArray();

    const populated = await Promise.all(convos.map(async (c) => {
      const otherId = c.participants.find((p) => p !== req.userId);
      const other = otherId
        ? await db().collection("users").findOne(
            { _id: new ObjectId(otherId) }, { projection: { password: 0, email: 0 } }
          )
        : null;
      const unread = await db().collection("messages").countDocuments({
        conversationId: c._id.toString(), senderId: { $ne: req.userId }, read: false,
      });
      return { ...c, otherUser: other, unreadCount: unread };
    }));

    return res.status(200).json({ conversations: populated });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

export const getOrCreate = async (req, res) => {
  try {
    const { userId } = req.params;
    const me = req.userId;

    const friendship = await db().collection("friendRequests").findOne({
      $or: [{ senderId: me, receiverId: userId }, { senderId: userId, receiverId: me }],
      status: "accepted",
    });
    if (!friendship) return res.status(403).json({ msg: "You can only chat with friends" });

    let convo = await db().collection("conversations").findOne({
      participants: { $all: [me, userId] },
    });
    if (!convo) {
      const r = await db().collection("conversations").insertOne({
        participants: [me, userId], lastMessage: null,
        createdAt: new Date(), updatedAt: new Date(),
      });
      convo = await db().collection("conversations").findOne({ _id: r.insertedId });
    }

    const other = await db().collection("users").findOne(
      { _id: new ObjectId(userId) }, { projection: { password: 0, email: 0 } }
    );
    return res.status(200).json({ conversation: convo, otherUser: other });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const convo = await db().collection("conversations").findOne({
      _id: new ObjectId(conversationId), participants: req.userId,
    });
    if (!convo) return res.status(403).json({ msg: "Unauthorized" });

    const query = { conversationId };
    if (req.query.before) query.sentAt = { $lt: new Date(req.query.before) };

    const messages = await db().collection("messages")
      .find(query).sort({ sentAt: -1 }).limit(50).toArray();

    await db().collection("messages").updateMany(
      { conversationId, senderId: { $ne: req.userId }, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json({ messages: messages.reverse() });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

export const sendMessageRest = async (req, res) => {
  try {
    const { conversationId, type, text, song, playlist } = req.body;
    const me = req.userId;

    const convo = await db().collection("conversations").findOne({
      _id: new ObjectId(conversationId), participants: me,
    });
    if (!convo) return res.status(403).json({ msg: "Unauthorized" });

    const msg = {
      conversationId,
      senderId: me,
      type:     type || "text",
      text:     text || "",
      song:     song     || null,
      playlist: playlist || null,
      sentAt:   new Date(),
      read:     false,
    };

    const { insertedId } = await db().collection("messages").insertOne(msg);

    const preview =
      msg.type === "song"     ? `🎵 ${msg.song?.title}`
    : msg.type === "playlist" ? `🎵 ${msg.playlist?.playlistName}`
    : msg.text.slice(0, 60);

    await db().collection("conversations").updateOne(
      { _id: new ObjectId(conversationId) },
      { $set: { lastMessage: { preview, senderId: me, sentAt: new Date() }, updatedAt: new Date() } }
    );

    try {
      const { io } = await import("../server.js");
      io.to(conversationId).emit("message", { ...msg, _id: insertedId });
    } catch {}

    return res.status(201).json({ message: { ...msg, _id: insertedId } });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};