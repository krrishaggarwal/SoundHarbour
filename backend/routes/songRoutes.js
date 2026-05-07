//songRoutes.js
import express from "express";
import multer from "multer";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";
import { userJwtMiddleware } from "../middlewares/authMiddleware.js";
import { addSong, deleteSong, getSongs, streamSong, searchSongs, updateSong, streamSongById } from "../controllers/songController.js";
const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// PUBLIC
router.get("/", getSongs);
router.get("/search", searchSongs);
router.get("/stream/:filename", streamSong);
router.get("/stream/id/:id", streamSongById);

// ADMIN
router.post(
  "/upload",
  userJwtMiddleware,
  adminMiddleware,
  upload.single("audio"),
  addSong
);

router.delete(
  "/delete/:id",
  userJwtMiddleware,
  adminMiddleware,
  deleteSong
);

router.put(
  "/update/:id",
  userJwtMiddleware,
  adminMiddleware,
  updateSong
);

export default router;