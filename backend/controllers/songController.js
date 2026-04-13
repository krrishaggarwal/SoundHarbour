import conn from "../config/db.js";
import fs from "fs";
import mongodb from "mongodb";

export const addSong = async (req, res) => {
  try {
    const { title, artist, album, description, genre } = req.body;

    if (!title || !artist || !album || !description || !genre) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    if (!req.file) {
      return res.status(400).json({ msg: "Audio file is required" });
    }

    const db = conn.db("music_streaming");
    const collection = db.collection("songs");

    const bucket = new mongodb.GridFSBucket(db, {
      bucketName: "uploads",
    });

    const uploadStream = bucket.openUploadStream(req.file.originalname);

    const readStream = fs.createReadStream(req.file.path);

    readStream.on("error", (err) => {
      console.error("ReadStream Error:", err);
      return res.status(500).json({ error: "File read failed" });
    });

    uploadStream.on("error", (err) => {
      console.error("UploadStream Error:", err);
      return res.status(500).json({ error: "Upload failed" });
    });

    readStream.pipe(uploadStream);

    uploadStream.on("finish", async () => {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      await collection.insertOne({
        title,
        artist,
        album,
        genre,
        description,
        uploadedBy: req.userId,
        filename: req.file.originalname,
        fileId: uploadStream.id,
        createdAt: new Date(),
      });

      return res.status(201).json({
        message: "Song uploaded successfully",
      });
    });

  } catch (error) {
    console.error("MAIN ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const deleteSong = async (req, res) => {
  try {
    const { id } = req.params;

    const db = conn.db("music_streaming");
    const collection = db.collection("songs");
    const bucket = new mongodb.GridFSBucket(db, {
      bucketName: "uploads",
    });

    const song = await collection.findOne({
      _id: new mongodb.ObjectId(id),
    });

    if (!song) {
      return res.status(404).json({ msg: "Song not found" });
    }

    if (song.uploadedBy !== req.userId) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    await collection.deleteOne({ _id: song._id });

    await bucket.delete(song.fileId);

    return res.status(200).json({
      message: "Song deleted successfully",
      status: "success",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

export const getSongs = async (req, res) => {
  try {
    const db = conn.db("music_streaming");
    const collection = db.collection("songs");

    const songs = await collection.find({}).toArray();

    return res.status(200).json({ songs });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

export const streamSong = async (req, res) => {
  try {
    const { filename } = req.params;
    console.log("🎵 Stream requested:", filename); 

    if (!filename) {
      return res.status(400).json({ msg: "Filename required" });
    }

    const db = conn.db("music_streaming");
    const bucket = new mongodb.GridFSBucket(db, { bucketName: "uploads" });

    const files = await db.collection("uploads.files").find({ filename }).toArray();
    if (files.length === 0) {
      console.log("❌ File not found in GridFS:", filename);
      return res.status(404).json({ msg: "File not found" });
    }
    console.log("✅ File found, streaming...");

    res.set("Content-Type", "audio/mpeg");
    const stream = bucket.openDownloadStreamByName(filename);

    stream.on("error", (err) => {
      console.error("Stream error:", err);
      res.status(500).json({ msg: "Stream error" });
    });

    stream.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const searchSongs = async (req, res) => {
  try {
    const q = req.query.q;

    if (!q) {
      return res.status(400).json({ msg: "Search query required" });
    }

    const db = conn.db("music_streaming");
    const collection = db.collection("songs");

    const songs = await collection.find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { artist: { $regex: q, $options: "i" } },
        { genre: { $regex: q, $options: "i" } },
      ],
    }).toArray();

    res.status(200).json({ songs });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const updateSong = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, artist, album, genre, description } = req.body;

    const db = conn.db("music_streaming");
    const collection = db.collection("songs");

    const song = await collection.findOne({
      _id: new mongodb.ObjectId(id),
    });

    if (!song) {
      return res.status(404).json({ msg: "Song not found" });
    }

    if (song.uploadedBy !== req.userId) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    const updateFields = {};
    if (title) updateFields.title = title;
    if (artist) updateFields.artist = artist;
    if (album) updateFields.album = album;
    if (genre) updateFields.genre = genre;
    if (description) updateFields.description = description;

    await collection.updateOne(
      { _id: new mongodb.ObjectId(id) },
      { $set: updateFields }
    );

    return res.status(200).json({
      message: "Song updated successfully",
      status: "success",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

export const streamSongById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ msg: "File ID required" });
    }

    const db = conn.db("music_streaming");
    const bucket = new mongodb.GridFSBucket(db, { bucketName: "uploads" });

    const objectId = new mongodb.ObjectId(id);
    const files = await db.collection("uploads.files").find({ _id: objectId }).toArray();
    if (files.length === 0) {
      console.log("Streaming by ID:", id);
      return res.status(404).json({ msg: "File not found" });
    }

    res.set("Content-Type", "audio/mpeg");
    const stream = bucket.openDownloadStream(objectId);
    stream.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};