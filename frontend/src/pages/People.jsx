import React, { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { SongContext } from "../Context/SongContext";
import { SocketContext } from "../Context/SocketContext";
import { FiSearch, FiUserPlus, FiUserCheck, FiUserX, FiMessageCircle, FiUser } from "react-icons/fi";
import { BsGlobe2, BsLockFill, BsBellFill } from "react-icons/bs";

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Av = ({ name, size = "md", online }) => {
  const initials = name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";
  const palette = ["from-amber-400 to-orange-500","from-emerald-400 to-teal-600","from-violet-400 to-purple-600","from-rose-400 to-pink-600","from-sky-400 to-blue-600"];
  const g = palette[initials.charCodeAt(0) % palette.length];
  const sz = size === "lg" ? "w-14 h-14 text-lg" : size === "sm" ? "w-9 h-9 text-xs" : "w-11 h-11 text-sm";
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sz} rounded-full bg-gradient-to-br ${g} flex items-center justify-center font-bold text-white`}>{initials}</div>
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-900 ${online ? "bg-emerald-400" : "bg-gray-600"}`} />
      )}
    </div>
  );
};

// ─── Friend Request Card ──────────────────────────────────────────────────────
const RequestCard = ({ req, onAccept, onReject }) => (
  <div className="flex items-center gap-3 p-3 bg-gray-800/60 border border-amber-500/20 rounded-2xl">
    <Link to={`/user/${req.sender?._id}`} className="flex-shrink-0 hover:opacity-80 transition-opacity">
      <Av name={req.sender?.fullName} />
    </Link>
    <div className="flex-1 min-w-0">
      <Link to={`/user/${req.sender?._id}`} className="hover:text-amber-400 transition-colors">
        <p className="font-semibold text-white text-sm truncate">{req.sender?.fullName}</p>
      </Link>
      <p className="text-gray-500 text-xs">Sent you a friend request</p>
    </div>
    <div className="flex gap-2">
      <button onClick={() => onAccept(req._id)} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold hover:bg-emerald-500/30 transition-colors">
        Accept
      </button>
      <button onClick={() => onReject(req._id)} className="px-3 py-1.5 bg-gray-700 text-gray-400 border border-gray-600 rounded-lg text-xs hover:bg-gray-600 transition-colors">
        Decline
      </button>
    </div>
  </div>
);

// ─── User Card ────────────────────────────────────────────────────────────────
const UserCard = ({ user, myRelationship, onFollow, onUnfollow, onSendRequest, onCancelRequest, onRemoveFriend, onChat, isOnline }) => {
  const { isFollowing, isFollowedBy, isFriend, friendRequest } = myRelationship || {};
  const isPending = friendRequest?.status === "pending";
  const iSent = friendRequest?.senderId !== user._id?.toString(); // I sent it

  const profilePath = `/user/${user._id}`;

  return (
    <div className="flex items-center gap-3 p-4 bg-gray-800/50 border border-gray-700/50 rounded-2xl hover:border-gray-600/70 transition-all">
      <Link to={profilePath} className="flex-shrink-0 hover:opacity-80 transition-opacity">
        <Av name={user.fullName} online={isOnline(user._id?.toString())} />
      </Link>

      <div className="flex-1 min-w-0">
        <Link to={profilePath} className="group flex items-center gap-2 hover:opacity-80 transition-opacity">
          <p className="font-semibold text-white text-sm truncate group-hover:text-amber-400 transition-colors">{user.fullName}</p>
          {user.isPublic
            ? <BsGlobe2 size={11} className="text-gray-500 flex-shrink-0" />
            : <BsLockFill size={11} className="text-gray-600 flex-shrink-0" />}
        </Link>
        <div className="flex items-center gap-2 mt-0.5">
          {isFollowedBy && <span className="text-xs text-gray-500">Follows you</span>}
          {isFriend && <span className="text-xs text-emerald-500">● Friends</span>}
          {isPending && <span className="text-xs text-amber-500">{iSent ? "Request sent" : "Wants to be friends"}</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isFriend ? (
          <>
            <button onClick={() => onChat(user._id?.toString())}
              className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25 transition-colors">
              <FiMessageCircle size={15} />
            </button>
            <button onClick={() => onRemoveFriend(user._id?.toString())}
              className="p-2 rounded-xl bg-gray-700 text-gray-400 border border-gray-600 hover:bg-rose-500/15 hover:text-rose-400 hover:border-rose-500/25 transition-colors">
              <FiUserX size={15} />
            </button>
          </>
        ) : isPending ? (
          iSent ? (
            <button onClick={() => onCancelRequest(user._id?.toString())}
              className="px-3 py-1.5 bg-gray-700 text-gray-400 border border-gray-600 rounded-xl text-xs hover:bg-gray-600 transition-colors">
              Cancel
            </button>
          ) : (
            <div className="flex gap-1.5">
              <button onClick={() => onSendRequest(user._id?.toString(), friendRequest?._id)}
                className="px-3 py-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded-xl text-xs font-semibold hover:bg-emerald-500/25 transition-colors">
                Accept
              </button>
              <button onClick={() => onCancelRequest(user._id?.toString())}
                className="px-3 py-1.5 bg-gray-700 text-gray-400 border border-gray-600 rounded-xl text-xs hover:bg-gray-600 transition-colors">
                Decline
              </button>
            </div>
          )
        ) : (
          <button onClick={() => onSendRequest(user._id?.toString())}
            className="p-2 rounded-xl bg-violet-500/15 text-violet-400 border border-violet-500/25 hover:bg-violet-500/25 transition-colors"
            title="Send friend request">
            <FiUserPlus size={15} />
          </button>
        )}

        {!isFriend && (
          <button onClick={() => isFollowing ? onUnfollow(user._id?.toString()) : onFollow(user._id?.toString())}
            className={`p-2 rounded-xl border transition-colors
              ${isFollowing
                ? "bg-gray-700 text-white border-gray-600 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20"
                : "bg-sky-500/15 text-sky-400 border-sky-500/25 hover:bg-sky-500/25"}`}
            title={isFollowing ? "Unfollow" : "Follow"}>
            {isFollowing ? <FiUserCheck size={15} /> : <FiUserPlus size={15} />}
          </button>
        )}

        {user.isPublic && (
          <Link to={`/user/${user._id}`}
            className="p-2 rounded-xl bg-gray-700 text-gray-400 border border-gray-600 hover:bg-gray-600 transition-colors">
            <FiUser size={15} />
          </Link>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const People = () => {
  const { __URL__ } = useContext(SongContext);
  const { isOnline } = useContext(SocketContext);
  const navigate = useNavigate();

  const [tab, setTab]                 = useState("discover"); // discover | friends | requests
  const [query, setQuery]             = useState("");
  const [results, setResults]         = useState([]);
  const [friends, setFriends]         = useState([]);
  const [requests, setRequests]       = useState([]);
  const [relationships, setRelationships] = useState({}); // userId -> rel
  const [searching, setSearching]     = useState(false);
  const [loading, setLoading]         = useState(false);

  const headers = { "x-auth-token": localStorage.getItem("token") };

  const loadBase = useCallback(async () => {
    setLoading(true);
    try {
      const [frRes, reqRes] = await Promise.all([
        axios.get(`${__URL__}/api/v1/follow/friends`,  { headers }),
        axios.get(`${__URL__}/api/v1/follow/requests`, { headers }),
      ]);
      setFriends(frRes.data.friends || []);
      setRequests(reqRes.data.requests || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [__URL__]);

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/login"); return; }
    loadBase();
  }, []);

  const search = async (q) => {
    if (!q.trim()) { setResults([]); return; }
    try {
      setSearching(true);
      const { data } = await axios.get(`${__URL__}/api/v1/follow/search?q=${encodeURIComponent(q)}`, { headers });
      const users = data.users || [];
      setResults(users);
      // Fetch relationships in parallel
      const rels = await Promise.all(
        users.map((u) =>
          axios.get(`${__URL__}/api/v1/follow/status/${u._id}`, { headers })
            .then((r) => [u._id.toString(), r.data])
            .catch(() => [u._id.toString(), {}])
        )
      );
      setRelationships(Object.fromEntries(rels));
    } catch (err) { console.error(err); }
    finally { setSearching(false); }
  };

  useEffect(() => {
    const t = setTimeout(() => { if (tab === "discover") search(query); }, 400);
    return () => clearTimeout(t);
  }, [query, tab]);

  const follow    = async (uid) => { await axios.post(`${__URL__}/api/v1/follow/${uid}`,        {}, { headers }); refreshRel(uid); };
  const unfollow  = async (uid) => { await axios.delete(`${__URL__}/api/v1/follow/${uid}`,         { headers }); refreshRel(uid); };
  const sendReq   = async (uid) => { await axios.post(`${__URL__}/api/v1/follow/request/${uid}`, {}, { headers }); refreshRel(uid); loadBase(); };
  const cancelReq = async (uid) => { await axios.delete(`${__URL__}/api/v1/follow/request/${uid}`,  { headers }); refreshRel(uid); loadBase(); };
  const removeFr  = async (uid) => { await axios.delete(`${__URL__}/api/v1/follow/friend/${uid}`,   { headers }); refreshRel(uid); loadBase(); };

  const acceptReq = async (requestId) => {
    await axios.put(`${__URL__}/api/v1/follow/request/${requestId}`, { action: "accept" }, { headers });
    loadBase();
  };
  const rejectReq = async (requestId) => {
    await axios.put(`${__URL__}/api/v1/follow/request/${requestId}`, { action: "reject" }, { headers });
    loadBase();
  };

  const refreshRel = async (uid) => {
    const { data } = await axios.get(`${__URL__}/api/v1/follow/status/${uid}`, { headers });
    setRelationships((prev) => ({ ...prev, [uid.toString()]: data }));
  };

  const openChat = (userId) => navigate(`/chat?with=${userId}`);

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-32">
      <div className="max-w-2xl mx-auto px-4 pt-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-white">People</h1>
            <p className="text-gray-500 text-sm mt-1">Discover, follow & connect</p>
          </div>
          {requests.length > 0 && (
            <button onClick={() => setTab("requests")}
              className="flex items-center gap-2 bg-amber-500/15 text-amber-400 border border-amber-500/25 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-amber-500/25 transition-colors">
              <BsBellFill size={13} />
              {requests.length} request{requests.length > 1 ? "s" : ""}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900 p-1 rounded-2xl border border-gray-800">
          {[["discover","🔍 Discover"],["friends",`🤝 Friends (${friends.length})`],["requests",`🔔 Requests (${requests.length})`]].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors
                ${tab === t ? "bg-gray-800 text-white shadow" : "text-gray-400 hover:text-white"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Discover ── */}
        {tab === "discover" && (
          <div className="space-y-4">
            <div className="relative">
              <FiSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search people by name…"
                className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-2xl text-sm outline-none placeholder-gray-500 border border-gray-700 focus:border-amber-500/50 transition-colors" />
            </div>

            {searching ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                {results.map((u) => (
                  <UserCard key={u._id} user={u}
                    myRelationship={relationships[u._id?.toString()]}
                    onFollow={follow} onUnfollow={unfollow}
                    onSendRequest={sendReq} onCancelRequest={cancelReq}
                    onRemoveFriend={removeFr} onChat={openChat}
                    isOnline={isOnline} />
                ))}
              </div>
            ) : query.trim() ? (
              <div className="text-center py-12 text-gray-500">
                <p>No users found for "<span className="text-white">{query}</span>"</p>
              </div>
            ) : (
              <div className="text-center py-12 space-y-2 text-gray-500">
                <p className="text-4xl">🎵</p>
                <p>Search for people to follow and chat with</p>
              </div>
            )}
          </div>
        )}

        {/* ── Friends ── */}
        {tab === "friends" && (
          <div className="space-y-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <p className="text-4xl">🤝</p>
                <p className="text-gray-500">No friends yet. Search for people and send a friend request!</p>
                <button onClick={() => setTab("discover")} className="text-amber-400 text-sm hover:underline">
                  Discover people →
                </button>
              </div>
            ) : friends.map((f) => (
              <div key={f._id} className="flex items-center gap-3 p-4 bg-gray-800/50 border border-gray-700/50 rounded-2xl hover:border-gray-600/70 transition-all">
                <Link to={`/user/${f._id}`} className="flex-shrink-0 hover:opacity-80 transition-opacity">
                  <Av name={f.fullName} online={isOnline(f._id?.toString())} />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/user/${f._id}`} className="hover:text-amber-400 transition-colors">
                    <p className="font-semibold text-white text-sm truncate">{f.fullName}</p>
                  </Link>
                  <p className={`text-xs ${isOnline(f._id?.toString()) ? "text-emerald-400" : "text-gray-500"}`}>
                    {isOnline(f._id?.toString()) ? "Online" : "Offline"}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => openChat(f._id?.toString())}
                    className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25 transition-colors">
                    <FiMessageCircle size={15} />
                  </button>
                  <button onClick={() => removeFr(f._id?.toString())}
                    className="p-2 rounded-xl bg-gray-700 text-gray-400 border border-gray-600 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-colors">
                    <FiUserX size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Requests ── */}
        {tab === "requests" && (
          <div className="space-y-2">
            {requests.length === 0 ? (
              <div className="text-center py-12 space-y-2 text-gray-500">
                <p className="text-4xl">🔔</p>
                <p>No pending friend requests</p>
              </div>
            ) : requests.map((r) => (
              <RequestCard key={r._id} req={r} onAccept={acceptReq} onReject={rejectReq} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default People;