//authController.js
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

    const db = conn.db("SoundHarbour");
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: "No account found with that email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Incorrect password" });
    }

    return res.status(200).json({
      message: "User logged in",
      status: "success",
      token:    generateToken(user),
      role:     user.role,
      fullName: user.fullName,
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

    const db = conn.db("SoundHarbour");
    const userExists = await db.collection("users").findOne({ email });
    if (userExists) {
      return res.status(400).json({ msg: "An account with that email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.collection("users").insertOne({
      fullName,
      email,
      password: hashedPassword,
      role: "user",
      playlists: [],
      isPublic: false,
      createdAt: new Date(),
    });

    return res.status(201).json({ message: "Account created successfully", status: "success" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};