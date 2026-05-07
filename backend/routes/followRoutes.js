//followRoutes.js
import express from "express";
import {
  followUser, unfollowUser,
  sendFriendRequest, respondFriendRequest, cancelFriendRequest, removeFriend,
  getRelationship, getPendingRequests, getFriends,
  getFollowers, getFollowing, searchUsers,
} from "../controllers/followController.js";
import { userJwtMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(userJwtMiddleware);

router.get("/search",searchUsers);
router.get("/friends",getFriends);
router.get("/requests",getPendingRequests);
router.get("/followers",getFollowers);
router.get("/following",getFollowing);
router.get("/status/:userId",getRelationship);
router.post("/:userId",followUser);
router.delete("/:userId",unfollowUser);
router.post("/request/:userId",sendFriendRequest);
router.delete("/request/:userId",cancelFriendRequest);
router.put("/request/:requestId",respondFriendRequest);
router.delete("/friend/:userId",removeFriend);

export default router;