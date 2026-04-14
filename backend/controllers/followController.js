import { ObjectId } from "mongodb";
import conn from "../config/db.js";

const db = () => conn.db("SoundHarbour");

// ── Follow / Unfollow ────────────────────────────────────────────────────────

export const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const me = req.userId;
    if (userId === me) return res.status(400).json({ msg: "Cannot follow yourself" });

    const existing = await db().collection("follows").findOne({ followerId: me, followingId: userId });
    if (existing) return res.status(400).json({ msg: "Already following" });

    await db().collection("follows").insertOne({ followerId: me, followingId: userId, createdAt: new Date() });
    return res.status(201).json({ message: "Followed" });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

export const unfollowUser = async (req, res) => {
  try {
    await db().collection("follows").deleteOne({ followerId: req.userId, followingId: req.params.userId });
    return res.status(200).json({ message: "Unfollowed" });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

// ── Friend requests ──────────────────────────────────────────────────────────

export const sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const me = req.userId;
    if (userId === me) return res.status(400).json({ msg: "Cannot friend yourself" });

    const existing = await db().collection("friendRequests").findOne({
      $or: [{ senderId: me, receiverId: userId }, { senderId: userId, receiverId: me }],
    });
    if (existing) {
      if (existing.status === "accepted") return res.status(400).json({ msg: "Already friends" });
      return res.status(400).json({ msg: "Request already pending" });
    }

    await db().collection("friendRequests").insertOne({
      senderId: me, receiverId: userId, status: "pending", createdAt: new Date(),
    });
    return res.status(201).json({ message: "Friend request sent" });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

export const respondFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // "accept" | "reject"
    const me = req.userId;

    const req_ = await db().collection("friendRequests").findOne({
      _id: new ObjectId(requestId), receiverId: me, status: "pending",
    });
    if (!req_) return res.status(404).json({ msg: "Request not found" });

    await db().collection("friendRequests").updateOne(
      { _id: new ObjectId(requestId) },
      { $set: { status: action === "accept" ? "accepted" : "rejected", respondedAt: new Date() } }
    );

    if (action === "accept") {
      const exists = await db().collection("conversations").findOne({
        participants: { $all: [req_.senderId, me] },
      });
      if (!exists) {
        await db().collection("conversations").insertOne({
          participants: [req_.senderId, me],
          lastMessage: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
    return res.status(200).json({ message: action === "accept" ? "Friend request accepted" : "Rejected" });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

export const cancelFriendRequest = async (req, res) => {
  try {
    await db().collection("friendRequests").deleteOne({
      senderId: req.userId, receiverId: req.params.userId, status: "pending",
    });
    return res.status(200).json({ message: "Request cancelled" });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

export const removeFriend = async (req, res) => {
  try {
    const { userId } = req.params;
    const me = req.userId;
    await db().collection("friendRequests").deleteOne({
      $or: [{ senderId: me, receiverId: userId }, { senderId: userId, receiverId: me }],
      status: "accepted",
    });
    return res.status(200).json({ message: "Friend removed" });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

// ── Queries ──────────────────────────────────────────────────────────────────

export const getRelationship = async (req, res) => {
  try {
    const { userId } = req.params;
    const me = req.userId;
    const [following, followedBy, friendReq] = await Promise.all([
      db().collection("follows").findOne({ followerId: me, followingId: userId }),
      db().collection("follows").findOne({ followerId: userId, followingId: me }),
      db().collection("friendRequests").findOne({
        $or: [{ senderId: me, receiverId: userId }, { senderId: userId, receiverId: me }],
      }),
    ]);
    return res.status(200).json({
      isFollowing: !!following,
      isFollowedBy: !!followedBy,
      isFriend: friendReq?.status === "accepted",
      friendRequest: friendReq || null,
    });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

export const getPendingRequests = async (req, res) => {
  try {
    const reqs = await db().collection("friendRequests")
      .find({ receiverId: req.userId, status: "pending" })
      .sort({ createdAt: -1 })
      .toArray();

    const populated = await Promise.all(reqs.map(async (r) => {
      const sender = await db().collection("users").findOne(
        { _id: new ObjectId(r.senderId) }, { projection: { password: 0, email: 0 } }
      );
      return { ...r, sender };
    }));
    return res.status(200).json({ requests: populated });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

export const getFriends = async (req, res) => {
  try {
    const me = req.userId;
    const reqs = await db().collection("friendRequests")
      .find({ $or: [{ senderId: me }, { receiverId: me }], status: "accepted" })
      .toArray();

    const friends = await Promise.all(reqs.map(async (r) => {
      const friendId = r.senderId === me ? r.receiverId : r.senderId;
      const user = await db().collection("users").findOne(
        { _id: new ObjectId(friendId) }, { projection: { password: 0 } }
      );
      return user ? { ...user, requestId: r._id } : null;
    }));
    return res.status(200).json({ friends: friends.filter(Boolean) });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

export const getFollowers = async (req, res) => {
  try {
    const userId = req.params.userId || req.userId;
    const follows = await db().collection("follows").find({ followingId: userId }).toArray();
    const users = await Promise.all(follows.map(async (f) => {
      return db().collection("users").findOne(
        { _id: new ObjectId(f.followerId) }, { projection: { password: 0, email: 0 } }
      );
    }));
    return res.status(200).json({ followers: users.filter(Boolean) });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

export const getFollowing = async (req, res) => {
  try {
    const userId = req.params.userId || req.userId;
    const follows = await db().collection("follows").find({ followerId: userId }).toArray();
    const users = await Promise.all(follows.map(async (f) => {
      return db().collection("users").findOne(
        { _id: new ObjectId(f.followingId) }, { projection: { password: 0, email: 0 } }
      );
    }));
    return res.status(200).json({ following: users.filter(Boolean) });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q?.trim()) return res.status(400).json({ msg: "Query required" });

    const users = await db().collection("users")
      .find({ _id: { $ne: new ObjectId(req.userId) }, fullName: { $regex: q, $options: "i" } })
      .project({ password: 0 })
      .limit(20)
      .toArray();
    return res.status(200).json({ users });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};