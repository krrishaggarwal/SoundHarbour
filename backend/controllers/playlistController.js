//playlistController.js
import mongodb from "mongodb";
import conn from "../config/db.js";

export const addPlaylist = async (req, res) => {
  try {
    const { playlistName } = req.body;
    if (!playlistName) return res.status(400).json({ msg: "Playlist name is required" });

    await conn.db("SoundHarbour").collection("playlists").insertOne({
      playlistName,
      createdBy: req.userId,
      songs: [],
      createdAt: new Date(),
    });

    return res.status(201).json({ message: "Playlist created successfully", status: "success" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const deletePlaylist = async (req, res) => {
  try {
    const result = await conn.db("SoundHarbour").collection("playlists").deleteOne({
      _id: new mongodb.ObjectId(req.params.id),
      createdBy: req.userId,
    });

    if (result.deletedCount === 0)
      return res.status(404).json({ msg: "Playlist not found or unauthorized" });

    return res.status(200).json({ message: "Playlist deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const addSongToPlaylist = async (req, res) => {
  try {
    const { song } = req.body;
    if (!song?.title || !song?.fileId)
      return res.status(400).json({ msg: "Song data required" });

    const result = await conn.db("SoundHarbour").collection("playlists").updateOne(
      { _id: new mongodb.ObjectId(req.params.id), createdBy: req.userId },
      { $push: { songs: song } }
    );

    if (result.matchedCount === 0)
      return res.status(404).json({ msg: "Playlist not found or unauthorized" });

    return res.status(200).json({ message: "Song added to playlist" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const removeSongFromPlaylist = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ msg: "Song title required" });

    const result = await conn.db("SoundHarbour").collection("playlists").updateOne(
      { _id: new mongodb.ObjectId(req.params.id), createdBy: req.userId },
      { $pull: { songs: { title } } }
    );

    if (result.matchedCount === 0)
      return res.status(404).json({ msg: "Playlist not found or unauthorized" });

    return res.status(200).json({ message: "Song removed from playlist" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getPlaylists = async (req, res) => {
  try {
    const playlists = await conn.db("SoundHarbour").collection("playlists")
      .find({ createdBy: req.userId })
      .toArray();
    return res.status(200).json({ playlists });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getPlaylist = async (req, res) => {
  try {
    const playlist = await conn.db("SoundHarbour").collection("playlists").findOne({
      _id: new mongodb.ObjectId(req.params.id),
    });

    if (!playlist) return res.status(404).json({ msg: "Playlist not found" });

    return res.status(200).json({ playlist });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};