import mongodb from "mongodb";
import conn from "../config/db.js";

export const addPlaylist = async (req, res) => {
  try {
    const { playlistName } = req.body;

    if (!playlistName) {
      return res.status(400).json({ msg: "Playlist name is required" });
    }

    const db = conn.db("music_streaming");
    const collection = db.collection("playlists");

    await collection.insertOne({
      playlistName,
      createdBy: req.userId,
      songs: [],
      createdAt: new Date(),
    });

    return res.status(201).json({
      message: "Playlist created successfully",
      status: "success",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

export const deletePlaylist = async (req, res) => {
  try {
    const { id } = req.params;

    const db = conn.db("music_streaming");
    const collection = db.collection("playlists");

    const result = await collection.deleteOne({
      _id: new mongodb.ObjectId(id),
      createdBy: req.userId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ msg: "Playlist not found or unauthorized" });
    }

    return res.status(200).json({
      message: "Playlist deleted successfully",
      status: "success",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

export const addSongToPlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    const { song } = req.body;

    if (!song || !song.title || !song.fileId) {
      return res.status(400).json({ msg: "Song data required" });
    }

    const db = conn.db("music_streaming");
    const collection = db.collection("playlists");

    const result = await collection.updateOne(
      { _id: new mongodb.ObjectId(id), createdBy: req.userId },
      { $push: { songs: song } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ msg: "Playlist not found or unauthorized" });
    }

    return res.status(200).json({
      message: "Song added to playlist",
      status: "success",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

export const removeSongFromPlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ msg: "Song title required" });
    }

    const db = conn.db("music_streaming");
    const collection = db.collection("playlists");

    const result = await collection.updateOne(
      { _id: new mongodb.ObjectId(id), createdBy: req.userId },
      { $pull: { songs: { title } } }  // ✅ fixed: use title
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ msg: "Playlist not found or unauthorized" });
    }

    return res.status(200).json({
      message: "Song removed from playlist",
      status: "success",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

export const getPlaylists = async (req, res) => {
  try {
    const db = conn.db("music_streaming");
    const collection = db.collection("playlists");

    const playlists = await collection
      .find({ createdBy: req.userId })
      .toArray();

    return res.status(200).json({ playlists });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

export const getPlaylist = async (req, res) => {
  try {
    const { id } = req.params;

    const db = conn.db("music_streaming");
    const collection = db.collection("playlists");

    const playlist = await collection.findOne({
      _id: new mongodb.ObjectId(id),
      createdBy: req.userId,
    });

    if (!playlist) {
      return res.status(404).json({ msg: "Playlist not found" });
    }

    return res.status(200).json({ playlist });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};