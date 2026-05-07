//userRoutes.js
import express from "express";
import {
  getProfile,
  updatePrivacy,
  getPublicProfile,
  trackPlay,
  getTopSongs,
  getRecentPlays,
  getPlaylistsSummary,
} from "../controllers/userController.js";
import { userJwtMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/public/:userId", getPublicProfile);
router.use(userJwtMiddleware);
router.get("/profile", getProfile);
router.put("/privacy", updatePrivacy);
router.post("/play", trackPlay);
router.get("/top-songs", getTopSongs);
router.get("/recent", getRecentPlays);
router.get("/playlists-summary", getPlaylistsSummary);

export default router;