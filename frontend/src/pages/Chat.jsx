import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import axios from "axios";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { SongContext } from "../Context/SongContext";
import { SocketContext } from "../Context/SocketContext";

import { FiSend, FiSearch, FiX, FiPlay, FiMusic, FiList, FiChevronLeft, FiUser } from "react-icons/fi";
import { BsCheckAll, BsCheck } from "react-icons/bs";
import { MdOutlineLibraryMusic } from "react-icons/md";
import musicbg from "../assets/musicbg.jpg";
import playlist_img from "../assets/playlist.jpg";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtTime = (d) => {
  if (!d) return "";
  const date = new Date(d);
  const now  = new Date();
  const diff = now - date;
  if (diff < 86400000) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800000) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const myId = () => {
  try { return JSON.parse(atob(localStorage.getItem("token")?.split(".")[1] || ""))?.id; }
  catch { return null; }
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Av = ({ name, size = "md", online }) => {
  const initials = name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";
  const palette  = ["from-amber-400 to-orange-500","from-emerald-400 to-teal-600","from-violet-400 to-purple-600","from-rose-400 to-pink-600","from-sky-400 to-blue-600"];
  const g = palette[(initials.charCodeAt(0) || 0) % palette.length];
  const sz = { lg: "w-11 h-11 text-sm", md: "w-9 h-9 text-xs", sm: "w-7 h-7 text-[10px]" }[size] || "w-9 h-9 text-xs";
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sz} rounded-full bg-gradient-to-br ${g} flex items-center justify-center font-bold text-white select-none`}>{initials}</div>
      {online !== undefined && (
        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${online ? "bg-emerald-400" : "bg-gray-600"}`}
          style={{ borderColor: "var(--bg-surface)" }} />
      )}
    </div>
  );
};

// ─── Song Bubble ─────────────────────────────────────────────────────────────
const SongBubble = ({ song, onPlay, isMine }) => (
  <div onClick={() => onPlay(song)}
    className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:opacity-90 transition-opacity max-w-[260px]"
    style={{
      background: isMine ? "rgba(245,158,11,0.15)" : "var(--bg-raised)",
      border: `1px solid ${isMine ? "rgba(245,158,11,0.3)" : "var(--border)"}`,
    }}>
    <div className="relative flex-shrink-0">
      <img src={musicbg} alt={song.title} className="w-11 h-11 rounded-xl object-cover" />
      <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
        <FiPlay size={14} className="text-white ml-0.5" />
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--accent)" }}>Song</p>
      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{song.title}</p>
      <p className="text-xs truncate" style={{ color: "var(--text-2)" }}>{song.artist}</p>
    </div>
  </div>
);

// ─── Playlist Bubble ──────────────────────────────────────────────────────────
const PlaylistBubble = ({ pl, isMine, onView }) => (
  <div className="flex items-center gap-3 p-3 rounded-2xl max-w-[260px]"
    style={{
      background: isMine ? "rgba(139,92,246,0.15)" : "var(--bg-raised)",
      border: `1px solid ${isMine ? "rgba(139,92,246,0.3)" : "var(--border)"}`,
    }}>
    <img src={playlist_img} alt={pl.playlistName} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#a78bfa" }}>Playlist</p>
      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{pl.playlistName}</p>
      <p className="text-xs" style={{ color: "var(--text-2)" }}>{pl.songCount} songs</p>
    </div>
    {onView && (
      <button onClick={() => onView(pl.playlistId)}
        className="p-1.5 rounded-lg flex-shrink-0 hover:opacity-80 transition-opacity"
        style={{ color: "#a78bfa", background: "rgba(139,92,246,0.15)" }}>
        <FiList size={14} />
      </button>
    )}
  </div>
);

// ─── Message Row ──────────────────────────────────────────────────────────────
const Message = ({ msg, isMine, onPlaySong, onViewPlaylist }) => (
  <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1 fade-up`}>
    <div className={`max-w-[78%] flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}>
      {msg.type === "song" && msg.song ? (
        <SongBubble song={msg.song} onPlay={onPlaySong} isMine={isMine} />
      ) : msg.type === "playlist" && msg.playlist ? (
        <PlaylistBubble pl={msg.playlist} isMine={isMine} onView={onViewPlaylist} />
      ) : (
        <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed max-w-xs break-words"
          style={{
            background: isMine ? "var(--accent)" : "var(--bg-raised)",
            color: isMine ? "#0a0a0f" : "var(--text-1)",
            borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          }}>
          {msg.text}
        </div>
      )}
      <div className={`flex items-center gap-1 text-[11px] px-1 ${isMine ? "flex-row-reverse" : ""}`}
        style={{ color: "var(--text-3)" }}>
        <span>{fmtTime(msg.sentAt)}</span>
        {isMine && (msg.read ? <BsCheckAll size={12} style={{ color: "var(--accent)" }} /> : <BsCheck size={12} />)}
      </div>
    </div>
  </div>
);

// ─── Song Picker ──────────────────────────────────────────────────────────────
const SongPicker = ({ __URL__, onSelect, onClose }) => {
  const [all,  setAll]  = useState([]);
  const [q,    setQ]    = useState("");

  useEffect(() => {
    axios.get(`${__URL__}/api/v1/song`)
      .then((r) => setAll(r.data.songs || []));
  }, []);

  const list = q.trim()
    ? all.filter((s) => s.title.toLowerCase().includes(q.toLowerCase()) || s.artist?.toLowerCase().includes(q.toLowerCase()))
    : all;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
      <div className="w-full max-w-sm rounded-2xl flex flex-col max-h-[70vh]"
        style={{ background: "var(--bg-raised)", border: "1px solid var(--border-md)" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="font-bold text-sm" style={{ color: "var(--text-1)" }}>🎵 Share a Song</span>
          <button onClick={onClose} style={{ color: "var(--text-3)" }}><FiX size={18} /></button>
        </div>
        <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: "var(--bg-hover)", color: "var(--text-1)", border: "1px solid var(--border)" }} />
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-0.5">
          {list.map((s) => (
            <button key={s._id} onClick={() => onSelect(s)}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors hover:opacity-80"
              style={{ background: "transparent" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <img src={musicbg} alt={s.title} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text-1)" }}>{s.title}</p>
                <p className="text-xs truncate" style={{ color: "var(--text-2)" }}>{s.artist}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Playlist Picker ──────────────────────────────────────────────────────────
const PlaylistPicker = ({ __URL__, onSelect, onClose }) => {
  const [list, setList] = useState([]);
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get(`${__URL__}/api/v1/playlist`, { headers: { "x-auth-token": token } })
      .then((r) => setList(r.data.playlists || []));
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
      <div className="w-full max-w-sm rounded-2xl flex flex-col max-h-[60vh]"
        style={{ background: "var(--bg-raised)", border: "1px solid var(--border-md)" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="font-bold text-sm" style={{ color: "var(--text-1)" }}>📋 Share a Playlist</span>
          <button onClick={onClose} style={{ color: "var(--text-3)" }}><FiX size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-0.5">
          {list.length === 0
            ? <p className="text-center py-8 text-sm" style={{ color: "var(--text-3)" }}>No playlists found.</p>
            : list.map((p) => (
              <button key={p._id} onClick={() => onSelect(p)}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors"
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <img src={playlist_img} alt={p.playlistName} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-1)" }}>{p.playlistName}</p>
                  <p className="text-xs" style={{ color: "var(--text-2)" }}>{p.songs.length} songs</p>
                </div>
              </button>
            ))
          }
        </div>
      </div>
    </div>
  );
};

// ─── Chat Window ──────────────────────────────────────────────────────────────
const ChatWindow = ({ conversationId, otherUser, onBack }) => {
  const ME = myId();
  const { __URL__, audio, setSongName, setSongArtist, setSongUrl, setIsPlaying } = useContext(SongContext);
  const { joinConversation, leaveConversation, sendMessage, onMessage, emitTyping, emitStopTyping, onTyping, onStopTyping, isOnline } = useContext(SocketContext);
  const navigate = useNavigate();

  const [messages,        setMessages]        = useState([]);
  const [text,            setText]            = useState("");
  const [otherTyping,     setOtherTyping]     = useState(false);
  const [showSongPicker,  setShowSongPicker]  = useState(false);
  const [showPLPicker,    setShowPLPicker]    = useState(false);
  const [loading,         setLoading]         = useState(true);
  const bottomRef   = useRef();
  const typingTimer = useRef();

  const headers = { "x-auth-token": localStorage.getItem("token") };
  const otherId = otherUser?._id?.toString();

  useEffect(() => {
    if (!conversationId) return;
    setMessages([]);
    setLoading(true);

    joinConversation(conversationId);

    axios.get(`${__URL__}/api/v1/chat/messages/${conversationId}`, { headers })
      .then((r) => setMessages(r.data.messages || []))
      .finally(() => setLoading(false));

    const offMsg  = onMessage((msg) => {
      if (msg.conversationId === conversationId)
        setMessages((prev) => [...prev.filter((m) => m._id?.toString() !== msg._id?.toString()), msg]);
    });
    const offT    = onTyping(({ userId }) => { if (userId === otherId) setOtherTyping(true); });
    const offST   = onStopTyping(({ userId }) => { if (userId === otherId) setOtherTyping(false); });

    return () => {
      leaveConversation(conversationId);
      offMsg(); offT(); offST();
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  const handleInput = (e) => {
    setText(e.target.value);
    emitTyping(conversationId);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitStopTyping(conversationId), 1500);
  };

  const sendMsg = (payload) => {
    sendMessage({ conversationId, ...payload });
  };

  const sendText = (e) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMsg({ type: "text", text: trimmed });
    setText("");
    emitStopTyping(conversationId);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(); }
  };

  const selectSong = (s) => {
    setShowSongPicker(false);
    sendMsg({ type: "song", song: { title: s.title, artist: s.artist, fileId: s.fileId, songId: s._id } });
  };
  const selectPL = (p) => {
    setShowPLPicker(false);
    sendMsg({ type: "playlist", playlist: { playlistId: p._id, playlistName: p.playlistName, songCount: p.songs.length } });
  };

  const playSong = (song) => {
    if (!audio) return;
    audio.pause();
    audio.src = `${__URL__}/api/v1/song/stream/id/${song.fileId}`;
    setSongName(song.title); setSongArtist(song.artist); setSongUrl(song.fileId);
    audio.load(); audio.play(); setIsPlaying(true);
  };

  const online = otherId ? isOnline(otherId) : false;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
        <button onClick={onBack} className="lg:hidden p-1 -ml-1 rounded-lg hover:opacity-70 transition-opacity"
          style={{ color: "var(--text-2)" }}>
          <FiChevronLeft size={22} />
        </button>
        <Av name={otherUser?.fullName} online={online} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: "var(--text-1)" }}>{otherUser?.fullName}</p>
          <p className="text-xs" style={{ color: otherTyping ? "var(--accent)" : online ? "#34d399" : "var(--text-3)" }}>
            {otherTyping ? "typing…" : online ? "Online" : "Offline"}
          </p>
        </div>
        {/* View profile button */}
        {otherUser?.isPublic && (
          <Link to={`/user/${otherId}`}
            className="p-2 rounded-xl transition-colors hover:opacity-70"
            style={{ color: "var(--text-2)", background: "var(--bg-raised)", border: "1px solid var(--border)" }}
            title="View Profile">
            <FiUser size={15} />
          </Link>
        )}
        {/* Always show profile link (even private profiles for friends) */}
        {!otherUser?.isPublic && otherId && (
          <Link to={`/user/${otherId}`}
            className="p-2 rounded-xl transition-colors hover:opacity-70"
            style={{ color: "var(--text-2)", background: "var(--bg-raised)", border: "1px solid var(--border)" }}
            title="View Profile">
            <FiUser size={15} />
          </Link>
        )}
      </div>

      {/* ── Messages ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5"
        style={{ background: "var(--bg-base)" }}>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
              <FiMusic size={22} style={{ color: "var(--text-3)" }} />
            </div>
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              No messages yet.<br />Say hi or share a song! 🎵
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <Message key={msg._id?.toString() || i}
              msg={msg}
              isMine={msg.senderId === ME}
              onPlaySong={playSong}
              onViewPlaylist={(id) => navigate(`/playlist/${id}`)}
            />
          ))
        )}

        {otherTyping && (
          <div className="flex justify-start mb-1">
            <div className="px-4 py-3 rounded-2xl flex gap-1.5 items-center"
              style={{ background: "var(--bg-raised)", borderRadius: "18px 18px 18px 4px" }}>
              {[0,1,2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full typing-dot"
                  style={{ background: "var(--text-3)", animationDelay: `${i * 180}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input Bar ──────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-3 py-3"
        style={{ background: "var(--bg-surface)", borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          {/* Share Song */}
          <button onClick={() => setShowSongPicker(true)} title="Share a song"
            className="w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "var(--accent)" }}>
            <FiMusic size={15} />
          </button>

          {/* Share Playlist */}
          <button onClick={() => setShowPLPicker(true)} title="Share a playlist"
            className="w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
            style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa" }}>
            <MdOutlineLibraryMusic size={15} />
          </button>

          {/* Text input */}
          <input
            value={text}
            onChange={handleInput}
            onKeyDown={handleKey}
            placeholder="Message…"
            autoComplete="off"
            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
            style={{
              background: "var(--bg-raised)",
              color: "var(--text-1)",
              border: "1px solid var(--border)",
            }}
            onFocus={(e) => e.target.style.borderColor = "rgba(245,158,11,0.4)"}
            onBlur={(e)  => e.target.style.borderColor = "var(--border)"}
          />

          {/* Send */}
          <button onClick={sendText} disabled={!text.trim()}
            className="w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 hover:opacity-80"
            style={{ background: "var(--accent)", color: "#0a0a0f" }}>
            <FiSend size={15} />
          </button>
        </div>
      </div>

      {showSongPicker && <SongPicker __URL__={__URL__} onSelect={selectSong} onClose={() => setShowSongPicker(false)} />}
      {showPLPicker   && <PlaylistPicker __URL__={__URL__} onSelect={selectPL} onClose={() => setShowPLPicker(false)} />}
    </div>
  );
};

// ─── Sidebar Conversation Item ────────────────────────────────────────────────
const ConvoItem = ({ convo, isActive, onClick, isOnline }) => {
  const online = isOnline(convo.otherUser?._id?.toString());
  return (
    <button onClick={onClick}
      className="flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-all text-left"
      style={{
        background: isActive ? "rgba(245,158,11,0.1)" : "transparent",
        border: isActive ? "1px solid rgba(245,158,11,0.2)" : "1px solid transparent",
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
      <Av name={convo.otherUser?.fullName} online={online} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="font-semibold text-sm truncate" style={{ color: "var(--text-1)" }}>{convo.otherUser?.fullName}</span>
          <span className="text-[10px] flex-shrink-0" style={{ color: "var(--text-3)" }}>{fmtTime(convo.lastMessage?.sentAt)}</span>
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <p className="text-xs truncate" style={{ color: "var(--text-2)" }}>
            {convo.lastMessage?.preview || "No messages yet"}
          </p>
          {convo.unreadCount > 0 && (
            <span className="flex-shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{ background: "var(--accent)", color: "#0a0a0f" }}>
              {convo.unreadCount > 9 ? "9+" : convo.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

// ─── Main Chat Page ───────────────────────────────────────────────────────────
const Chat = () => {
  const { __URL__ } = useContext(SongContext);
  const { isOnline } = useContext(SocketContext);
  const navigate     = useNavigate();
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [friends,       setFriends]       = useState([]);
  const [activeConvo,   setActiveConvo]   = useState(null);
  const [activeOther,   setActiveOther]   = useState(null);
  const [sidebarTab,    setSidebarTab]    = useState("chats");
  const [showChatPanel, setShowChatPanel] = useState(false); // mobile
  const [loading,       setLoading]       = useState(true);

  const headers     = { "x-auth-token": localStorage.getItem("token") };
  const initialLoad = useRef(false);

  // Load once on mount
  const loadAll = useCallback(async () => {
    try {
      const [convRes, frRes] = await Promise.all([
        axios.get(`${__URL__}/api/v1/chat/conversations`, { headers }),
        axios.get(`${__URL__}/api/v1/follow/friends`,     { headers }),
      ]);
      setConversations(convRes.data.conversations || []);
      setFriends(frRes.data.friends || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [__URL__]);

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/login"); return; }
    loadAll();
  }, []);

  // Open conversation via URL param (only once after initial load)
  useEffect(() => {
    const withUserId = searchParams.get("with");
    if (withUserId && !loading && !initialLoad.current) {
      initialLoad.current = true;
      openWithUser(withUserId);
    }
  }, [searchParams, loading]);

  const openWithUser = async (userId) => {
    // Don't reload sidebar — just open the conversation
    try {
      const { data } = await axios.get(`${__URL__}/api/v1/chat/with/${userId}`, { headers });
      setActiveConvo(data.conversation);
      setActiveOther(data.otherUser);
      setShowChatPanel(true);
      // Add to conversations list if not already there
      setConversations((prev) => {
        const exists = prev.find((c) => c._id === data.conversation._id?.toString() || c._id?.toString() === data.conversation._id?.toString());
        if (exists) return prev;
        return [{ ...data.conversation, otherUser: data.otherUser, unreadCount: 0 }, ...prev];
      });
    } catch (err) {
      alert(err.response?.data?.msg || "Cannot open chat — you must be friends first");
    }
  };

  const selectConvo = (convo) => {
    setActiveConvo(convo);
    setActiveOther(convo.otherUser);
    setShowChatPanel(true);
    // Mark read locally without API call
    setConversations((prev) => prev.map((c) =>
      c._id?.toString() === convo._id?.toString() ? { ...c, unreadCount: 0 } : c
    ));
  };

  const totalUnread = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0);

  const sidebarStyle = {
    background: "var(--bg-surface)",
    borderRight: "1px solid var(--border)",
  };

  return (
    <div className="flex overflow-hidden" style={{ height: "calc(100vh - 56px)" }}>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <div className={`${showChatPanel ? "hidden lg:flex" : "flex"} flex-col flex-shrink-0 w-full lg:w-[300px] xl:w-[340px]`}
        style={sidebarStyle}>

        <div className="px-4 pt-5 pb-3 flex-shrink-0">
          <h1 className="text-xl font-black" style={{ color: "var(--text-1)" }}>Messages</h1>
          {totalUnread > 0 && <p className="text-xs mt-0.5" style={{ color: "var(--accent)" }}>{totalUnread} unread</p>}
        </div>

        {/* Tabs */}
        <div className="flex px-3 gap-1 pb-3 flex-shrink-0">
          {[["chats", `Chats${totalUnread > 0 ? ` (${totalUnread})` : ""}`], ["friends", `Friends (${friends.length})`]].map(([t, label]) => (
            <button key={t} onClick={() => setSidebarTab(t)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: sidebarTab === t ? "rgba(245,158,11,0.12)" : "transparent",
                color: sidebarTab === t ? "var(--accent)" : "var(--text-2)",
                border: sidebarTab === t ? "1px solid rgba(245,158,11,0.2)" : "1px solid transparent",
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
            </div>
          ) : sidebarTab === "chats" ? (
            conversations.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-2">
                <p className="text-3xl">💬</p>
                <p className="text-sm" style={{ color: "var(--text-3)" }}>No conversations yet.<br />Add friends to chat.</p>
                <button onClick={() => navigate("/people")} className="text-xs hover:underline" style={{ color: "var(--accent)" }}>
                  Find people →
                </button>
              </div>
            ) : conversations.map((c) => (
              <ConvoItem key={c._id?.toString()} convo={c}
                isActive={activeConvo?._id?.toString() === c._id?.toString()}
                onClick={() => selectConvo(c)}
                isOnline={isOnline} />
            ))
          ) : (
            friends.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-2">
                <p className="text-3xl">🤝</p>
                <p className="text-sm" style={{ color: "var(--text-3)" }}>No friends yet.</p>
                <button onClick={() => navigate("/people")} className="text-xs hover:underline" style={{ color: "var(--accent)" }}>
                  Discover people →
                </button>
              </div>
            ) : friends.map((f) => (
              <button key={f._id?.toString()}
                onClick={() => openWithUser(f._id?.toString())}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-left transition-all"
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <Av name={f.fullName} online={isOnline(f._id?.toString())} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: "var(--text-1)" }}>{f.fullName}</p>
                  <p className="text-xs" style={{ color: isOnline(f._id?.toString()) ? "#34d399" : "var(--text-3)" }}>
                    {isOnline(f._id?.toString()) ? "Online" : "Offline"}
                  </p>
                </div>
                {f.isPublic && (
                  <Link to={`/user/${f._id}`} onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg transition-colors hover:opacity-70"
                    style={{ color: "var(--text-3)", border: "1px solid var(--border)" }}
                    title="View profile">
                    <FiUser size={13} />
                  </Link>
                )}
              </button>
            ))
          )}
        </div>

        <div className="px-3 pb-4 flex-shrink-0">
          <button onClick={() => navigate("/people")}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm transition-colors hover:opacity-70"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
            <FiSearch size={14} />
            Find people
          </button>
        </div>
      </div>

      {/* ── Chat Panel ──────────────────────────────────────────── */}
      <div className={`${showChatPanel ? "flex" : "hidden lg:flex"} flex-1 flex-col overflow-hidden`}
        style={{ background: "var(--bg-base)" }}>
        {activeConvo ? (
          <ChatWindow
            key={activeConvo._id?.toString()}
            conversationId={activeConvo._id?.toString()}
            otherUser={activeOther}
            onBack={() => setShowChatPanel(false)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
              <FiMusic size={28} style={{ color: "var(--text-3)" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--text-1)" }}>Music Chat</h2>
              <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
                Select a chat or message a friend.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;