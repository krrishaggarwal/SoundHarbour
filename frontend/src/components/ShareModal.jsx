import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { SongContext } from "../Context/SongContext";
import { SocketContext } from "../Context/SocketContext";
import { FiX, FiSend, FiCheck, FiSearch } from "react-icons/fi";
import { BsHeadphones } from "react-icons/bs";
import { MdOutlineLibraryMusic } from "react-icons/md";
import musicbg from "../assets/musicbg.jpg";
import playlistImg from "../assets/playlist.jpg";

const Av = ({ name }) => {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  const palette = [
    "from-amber-400 to-orange-500",
    "from-emerald-400 to-teal-600",
    "from-violet-400 to-purple-600",
    "from-rose-400 to-pink-600",
    "from-sky-400 to-blue-600",
  ];
  const g = palette[(initials.charCodeAt(0) || 0) % palette.length];
  return (
    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${g} flex items-center justify-center font-bold text-white text-xs flex-shrink-0`}>
      {initials}
    </div>
  );
};

const ShareModal = ({ type, payload, onClose }) => {
  const { __URL__ } = useContext(SongContext);
  const { sendMessage } = useContext(SocketContext);

  const [friends,   setFriends]   = useState([]);
  const [selected,  setSelected]  = useState(new Set());
  const [query,     setQuery]     = useState("");
  const [sending,   setSending]   = useState(false);
  const [done,      setDone]      = useState(false); // success state
  const [loading,   setLoading]   = useState(true);

  const headers = { "x-auth-token": localStorage.getItem("token") };

  useEffect(() => {
    axios.get(`${__URL__}/api/v1/follow/friends`, { headers })
      .then((r) => setFriends(r.data.friends || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (selected.size === 0) return;
    setSending(true);
    try {
      await Promise.all([...selected].map(async (friendId) => {
        const { data } = await axios.get(
          `${__URL__}/api/v1/chat/with/${friendId}`,
          { headers }
        );
        const convId = data.conversation._id?.toString();

        const msgPayload = {
          conversationId: convId,
          type,
          ...(type === "song"
            ? { song: payload }
            : { playlist: payload }),
        };

        await new Promise((resolve) => {
          sendMessage(msgPayload, (ack) => {
            if (!ack || ack.error) {
              axios.post(`${__URL__}/api/v1/chat/send`, msgPayload, { headers })
                .catch(console.error)
                .finally(resolve);
            } else {
              resolve();
            }
          });
          setTimeout(resolve, 1500);
        });
      }));

      setDone(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      console.error(err);
      alert("Failed to share. Make sure you are friends with the recipient.");
    } finally {
      setSending(false);
    }
  };

  const filtered = query.trim()
    ? friends.filter((f) => f.fullName.toLowerCase().includes(query.toLowerCase()))
    : friends;

  const Preview = () =>
    type === "song" ? (
      <div className="flex items-center gap-3 p-3 rounded-xl mb-1"
        style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
        <img src={musicbg} alt={payload.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--accent)" }}>Song</p>
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{payload.title}</p>
          <p className="text-xs truncate" style={{ color: "var(--text-2)" }}>{payload.artist}</p>
        </div>
        <BsHeadphones size={16} style={{ color: "var(--accent)" }} className="flex-shrink-0" />
      </div>
    ) : (
      <div className="flex items-center gap-3 p-3 rounded-xl mb-1"
        style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
        <img src={playlistImg} alt={payload.playlistName} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#a78bfa" }}>Playlist</p>
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{payload.playlistName}</p>
          <p className="text-xs" style={{ color: "var(--text-2)" }}>{payload.songCount} songs</p>
        </div>
        <MdOutlineLibraryMusic size={16} style={{ color: "#a78bfa" }} className="flex-shrink-0" />
      </div>
    );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>

      <div className="w-full max-w-sm rounded-2xl flex flex-col overflow-hidden"
        style={{ background: "var(--bg-raised)", border: "1px solid var(--border-md)", maxHeight: "85vh" }}>

        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="font-bold text-sm" style={{ color: "var(--text-1)" }}>
            Share with friends
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:opacity-70 transition-opacity"
            style={{ color: "var(--text-3)" }}>
            <FiX size={18} />
          </button>
        </div>

        <div className="px-4 pt-3 flex-shrink-0">
          <Preview />
        </div>

        <div className="px-4 py-2 flex-shrink-0">
          <div className="relative">
            <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-3)" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search friends…"
              className="w-full pl-8 pr-3 py-2 rounded-xl text-xs outline-none"
              style={{ background: "var(--bg-hover)", color: "var(--text-1)", border: "1px solid var(--border)" }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-0.5">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 space-y-1">
              <p className="text-2xl">🤝</p>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                {friends.length === 0
                  ? "You have no friends yet. Add some from the People page!"
                  : "No friends match your search."}
              </p>
            </div>
          ) : filtered.map((f) => {
            const id = f._id?.toString();
            const isSelected = selected.has(id);
            return (
              <button
                key={id}
                onClick={() => toggle(id)}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all text-left"
                style={{
                  background: isSelected ? "rgba(245,158,11,0.1)" : "transparent",
                  border: isSelected ? "1px solid rgba(245,158,11,0.25)" : "1px solid transparent",
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
              >
                <Av name={f.fullName} />
                <span className="flex-1 text-sm font-medium truncate" style={{ color: "var(--text-1)" }}>
                  {f.fullName}
                </span>
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    background: isSelected ? "var(--accent)" : "transparent",
                    border: `2px solid ${isSelected ? "var(--accent)" : "var(--border-md)"}`,
                  }}>
                  {isSelected && <FiCheck size={11} color="#0a0a0f" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
          {done ? (
            <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.25)" }}>
              <FiCheck size={15} />
              Sent!
            </div>
          ) : (
            <button
              onClick={handleSend}
              disabled={selected.size === 0 || sending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-30"
              style={{ background: "var(--accent)", color: "#0a0a0f" }}
            >
              <FiSend size={14} />
              {sending
                ? "Sending…"
                : `Send to ${selected.size > 0 ? `${selected.size} friend${selected.size > 1 ? "s" : ""}` : "…"}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;