import express from "express";
import { getConversations, getOrCreate, getMessages } from "../controllers/chatController.js";
import { userJwtMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(userJwtMiddleware);

router.get("/conversations",          getConversations);
router.get("/with/:userId",           getOrCreate);
router.get("/messages/:conversationId", getMessages);

export default router;