//playlistRoutes.js
import express from "express";
import {
    addPlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    getPlaylists,
    getPlaylist,
} from "../controllers/playlistController.js";
import { userJwtMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(userJwtMiddleware);
router.get("/", getPlaylists);
router.get("/:id", getPlaylist);
router.post("/create", addPlaylist);
router.delete("/delete/:id", deletePlaylist);
router.post("/add/:id", addSongToPlaylist);
router.delete("/remove/:id", removeSongFromPlaylist);

export default router;