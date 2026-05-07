//userController.js
import mongodb from "mongodb";
import conn from "../config/db.js";

export const getProfile = async (req, res) => {
  try {
    const db = conn.db("SoundHarbour");

    const user = await db.collection("users").findOne(
      { _id: new mongodb.ObjectId(req.userId) },
      { projection: { password: 0 } }
    );

    if (!user) return res.status(404).json({ msg: "User not found" });

    const playlistCount = await db
      .collection("playlists")
      .countDocuments({ createdBy: req.userId });

    const totalPlays = await db
      .collection("playHistory")
      .countDocuments({ userId: req.userId });

    return res.status(200).json({
      user: {
        ...user,
        isPublic: user.isPublic ?? false,
        playlistCount,
        totalPlays,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const updatePrivacy = async (req, res) => {
  try {
    const { isPublic } = req.body;

    if (typeof isPublic !== "boolean") {
      return res.status(400).json({ msg: "isPublic must be a boolean" });
    }

    const db = conn.db("SoundHarbour");

    await db.collection("users").updateOne(
      { _id: new mongodb.ObjectId(req.userId) },
      { $set: { isPublic } }
    );

    return res.status(200).json({
      message: isPublic
        ? "Profile is now public"
        : "Profile is now private",
      isPublic,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const getPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const db = conn.db("SoundHarbour");

    const user = await db.collection("users").findOne(
      { _id: new mongodb.ObjectId(userId) },
      { projection: { password: 0, email: 0 } }
    );
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (!user.isPublic) {
      return res.status(403).json({ msg: "This profile is private" });
    }

    const playlistCount = await db
      .collection("playlists")
      .countDocuments({ createdBy: userId });

    const totalPlays = await db
      .collection("playHistory")
      .countDocuments({ userId });

    const topSongs = await db
      .collection("playHistory")
      .aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: "$fileId",
            title: { $first: "$title" },
            artist: { $first: "$artist" },
            fileId: { $first: "$fileId" },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ])
      .toArray();

    const playlists = await db
      .collection("playlists")
      .find({ createdBy: userId })
      .toArray();

    return res.status(200).json({
      user: {
        _id: user._id,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt,
        playlistCount,
        totalPlays,
      },
      topSongs,
      playlists,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const trackPlay = async (req, res) => {
  try {
    const { songId, title, artist, fileId } = req.body;

    if (!title || !fileId) {
      return res.status(400).json({ msg: "Song info required" });
    }

    const db = conn.db("SoundHarbour");

    await db.collection("playHistory").insertOne({
      userId: req.userId,
      songId: songId || null,
      title,
      artist,
      fileId,
      playedAt: new Date(),
    });

    return res.status(201).json({ message: "Play tracked" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const getTopSongs = async (req, res) => {
  try {
    const db = conn.db("SoundHarbour");

    const topSongs = await db
      .collection("playHistory")
      .aggregate([
        { $match: { userId: req.userId } },
        {
          $group: {
            _id: "$fileId",
            title: { $first: "$title" },
            artist: { $first: "$artist" },
            fileId: { $first: "$fileId" },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ])
      .toArray();

    return res.status(200).json({ topSongs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const getRecentPlays = async (req, res) => {
  try {
    const db = conn.db("SoundHarbour");

    const recent = await db
      .collection("playHistory")
      .find({ userId: req.userId })
      .sort({ playedAt: -1 })
      .limit(10)
      .toArray();

    return res.status(200).json({ recent });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const getPlaylistsSummary = async (req, res) => {
  try {
    const db = conn.db("SoundHarbour");

    const playlists = await db
      .collection("playlists")
      .find({ createdBy: req.userId })
      .toArray();

    return res.status(200).json({ playlists });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};