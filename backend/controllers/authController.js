import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import conn from "../config/db.js";

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const db = conn.db("music_streaming");
    const collection = db.collection("users");
    const user = await collection.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    return res.status(200).json({
      message: "User logged in",
      status: "success",
      token: generateToken(user),
      role: user.role,
      fullName: user.fullName,   // ← included so navbar can show avatar
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const db = conn.db("music_streaming");
    const collection = db.collection("users");

    const userExists = await collection.findOne({ email });
    if (userExists) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await collection.insertOne({
      fullName,
      email,
      password: hashedPassword,
      role: "user",
      playlists: [],
      createdAt: new Date(),
    });

    return res.status(201).json({
      message: "User registered successfully",
      status: "success",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
