import React, {
  useState, useEffect, useRef, useContext, useCallback,
} from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SongContext } from "../Context/SongContext";
import { SocketContext } from "../Context/SocketContext";

import { FiSend, FiSearch, FiX, FiPlay, FiMusic, FiList, FiChevronLeft } from "react-icons/fi";
import { BsCheckAll, BsCheck, BsGlobe2 } from "react-icons/bs";
import { HiOutlineEmojiHappy } from "react-icons/hi";
import { MdOutlineLibraryMusic } from "react-icons/md";
import musicbg from "../assets/musicbg.jpg";
import playlist_img from "../assets/playlist.jpg";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtTime = (d) => {
  const date = new Date(d);
  const now = new Date();
  const diff = now - date;
  if (diff < 86400000) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800000) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Av = ({ name, size = "md", online }) => {
  const initials = name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";
  const palette = ["from-amber-400 to-orange-500","from-emerald-400 to-teal-600","from-violet-400 to-purple-600","from-rose-400 to-pink-600","from-sky-400 to-blue-600"];
  const g = palette[initials.charCodeAt(0) % palette.length];
  const sz = size === "lg" ? "w-12 h-12 text-base" : size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sz} rounded-full bg-gradient-to-br ${g} flex items-center justify-center font-bold text-white`}>{initials}</div>
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-900 ${online ? "bg-emerald-400" : "bg-gray-600"}`} />
      )}
    </div>
  );
};

// ─── Song Card (in chat) ──────────────────────────────────────────────────────
const SongBubble = ({ song, onPlay, isMine }) => (
  <div
    onClick={() => onPlay(song)}
    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all hover:opacity-90 max-w-xs
      ${isMine ? "bg-amber-500/20 border border-amber-500/30" : "bg-gray-800 border border-gray-700"}`}
  >
    <div className="relative flex-shrink-0">
      <img src={musicbg} alt={song.title} className="w-12 h-12 rounded-xl object-cover" />
      <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
        <FiPlay size={16} className="text-white ml-0.5" />
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-0.5">
        <FiMusic size={10} className={isMine ? "text-amber-400" : "text-amber-400"} />
        <span className="text-xs text-amber-400 font-semibold uppercase tracking-wide">Song</span>
      </div>
      <p className="text-white text-sm font-semibold truncate">{song.title}</p>
      <p className="text-gray-400 text-xs truncate">{song.artist}</p>
    </div>
  </div>
);

// ─── Playlist Card (in chat) ──────────────────────────────────────────────────
const PlaylistBubble = ({ pl, isMine, onView }) => (
  <div
    className={`flex items-center gap-3 p-3 rounded-2xl max-w-xs
      ${isMine ? "bg-violet-500/20 border border-violet-500/30" : "bg-gray-800 border border-gray-700"}`}
  >
    <img src={playlist_img} alt={pl.playlistName} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-0.5">
        <MdOutlineLibraryMusic size={10} className="text-violet-400" />
        <span className="text-xs text-violet-400 font-semibold uppercase tracking-wide">Playlist</span>
      </div>
      <p className="text-white text-sm font-semibold truncate">{pl.playlistName}</p>
      <p className="text-gray-400 text-xs">{pl.songCount} songs</p>
    </div>
    <button onClick={() => onView(pl.playlistId)} className="text-violet-400 hover:text-violet-300 flex-shrink-0">
      <FiList size={16} />
    </button>
  </div>
);

// ─── Single Message ───────────────────────────────────────────────────────────
const Message = ({ msg, isMine, onPlaySong, onViewPlaylist }) => {
  const bubble = isMine
    ? "bg-amber-500 text-white rounded-2xl rounded-br-sm"
    : "bg-gray-800 text-white rounded-2xl rounded-bl-sm";

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}>
      <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {msg.type === "song" && msg.song ? (
          <SongBubble song={msg.song} onPlay={onPlaySong} isMine={isMine} />
        ) : msg.type === "playlist" && msg.playlist ? (
          <PlaylistBubble pl={msg.playlist} isMine={isMine} onView={onViewPlaylist} />
        ) : (
          <div className={`px-4 py-2 ${bubble} text-sm leading-relaxed`}>{msg.text}</div>
        )}
        <div className={`flex items-center gap-1 text-xs text-gray-500 px-1 ${isMine ? "flex-row-reverse" : ""}`}>
          <span>{fmtTime(msg.sentAt)}</span>
          {isMine && (msg.read
            ? <BsCheckAll size={13} className="text-amber-400" />
            : <BsCheck size={13} />
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Song Picker Modal ────────────────────────────────────────────────────────
const SongPicker = ({ __URL__, onSelect, onClose }) => {
  const [songs, setSongs] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    axios.get(`${__URL__}/api/v1/song`).then((r) => setSongs(r.data.songs || []));
  }, []);

  const filtered = q.trim()
    ? songs.filter((s) => s.title.toLowerCase().includes(q.toLowerCase()) || s.artist.toLowerCase().includes(q.toLowerCase()))
    : songs;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="font-bold text-white">Share a Song</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><FiX /></button>
        </div>
        <div className="p-3 border-b border-gray-800">
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search songs…"
            className="w-full bg-gray-800 text-white px-3 py-2 rounded-xl text-sm outline-none placeholder-gray-500"
          />
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {filtered.map((s) => (
            <button key={s._id} onClick={() => onSelect(s)}
              className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-gray-800 transition-colors text-left">
              <img src={musicbg} alt={s.title} className="w-10 h-10 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{s.title}</p>
                <p className="text-gray-400 text-xs truncate">{s.artist}</p>
              </div>
              <FiMusic size={14} className="text-amber-400 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Playlist Picker Modal ────────────────────────────────────────────────────
const PlaylistPicker = ({ __URL__, onSelect, onClose }) => {
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get(`${__URL__}/api/v1/playlist`, { headers: { "x-auth-token": token } })
      .then((r) => setPlaylists(r.data.playlists || []));
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md max-h-[60vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="font-bold text-white">Share a Playlist</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><FiX /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {playlists.length === 0
            ? <p className="text-gray-500 text-sm text-center py-8">No playlists found.</p>
            : playlists.map((p) => (
              <button key={p._id} onClick={() => onSelect(p)}
                className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-gray-800 transition-colors text-left">
                <img src={playlist_img} alt={p.playlistName} className="w-10 h-10 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{p.playlistName}</p>
                  <p className="text-gray-400 text-xs">{p.songs.length} songs</p>
                </div>
                <MdOutlineLibraryMusic size={14} className="text-violet-400 flex-shrink-0" />
              </button>
            ))
          }
        </div>
      </div>
    </div>
  );
};

// ─── Chat Window ──────────────────────────────────────────────────────────────
const ChatWindow = ({ conversationId, otherUser, myId, onBack }) => {
  const { __URL__, audio, setSongName, setSongArtist, setSongUrl, setIsPlaying } = useContext(SongContext);
  const { joinConversation, leaveConversation, sendMessage, onMessage, emitTyping, emitStopTyping, onTyping, onStopTyping, isOnline } = useContext(SocketContext);
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [showSongPicker, setShowSongPicker] = useState(false);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef();
  const typingTimeout = useRef();

  useEffect(() => {
    if (!conversationId) return;
    joinConversation(conversationId);

    const headers = { "x-auth-token": localStorage.getItem("token") };
    axios.get(`${__URL__}/api/v1/chat/messages/${conversationId}`, { headers })
      .then((r) => { setMessages(r.data.messages || []); setLoading(false); })
      .catch(() => setLoading(false));

    const offMsg        = onMessage((msg) => {
      if (msg.conversationId === conversationId)
        setMessages((prev) => [...prev, msg]);
    });
    const offTyping     = onTyping(({ userId }) => { if (userId === otherUser?._id?.toString()) setOtherTyping(true); });
    const offStopTyping = onStopTyping(({ userId }) => { if (userId === otherUser?._id?.toString()) setOtherTyping(false); });

    return () => {
      leaveConversation(conversationId);
      offMsg(); offTyping(); offStopTyping();
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (!typing) { setTyping(true); emitTyping(conversationId); }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setTyping(false); emitStopTyping(conversationId);
    }, 1500);
  };

  const send = (payload) => {
    sendMessage({ conversationId, ...payload }, ({ error } = {}) => {
      if (error) console.error(error);
    });
    setText("");
  };

  const sendText = (e) => {
    e?.preventDefault();
    if (!text.trim()) return;
    send({ type: "text", text: text.trim() });
    emitStopTyping(conversationId);
  };

  const handleSongSelect = (song) => {
    setShowSongPicker(false);
    send({ type: "song", song: { title: song.title, artist: song.artist, fileId: song.fileId, songId: song._id } });
  };

  const handlePlaylistSelect = (pl) => {
    setShowPlaylistPicker(false);
    send({ type: "playlist", playlist: { playlistId: pl._id, playlistName: pl.playlistName, songCount: pl.songs.length } });
  };

  const playSong = (song) => {
    if (!audio) return;
    audio.pause();
    audio.src = `${__URL__}/api/v1/song/stream/id/${song.fileId}`;
    setSongName(song.title); setSongArtist(song.artist); setSongUrl(song.fileId);
    audio.load(); audio.play(); setIsPlaying(true);
  };

  const otherOnline = otherUser ? isOnline(otherUser._id?.toString()) : false;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900/80 backdrop-blur">
        <button onClick={onBack} className="lg:hidden text-gray-400 hover:text-white mr-1"><FiChevronLeft size={22} /></button>
        <Av name={otherUser?.fullName} online={otherOnline} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{otherUser?.fullName}</p>
          <p className={`text-xs ${otherOnline ? "text-emerald-400" : "text-gray-500"}`}>
            {otherTyping ? "typing…" : otherOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-10">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
              <FiMusic size={24} className="text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm">No messages yet.<br />Say hi or share a song! 🎵</p>
          </div>
        ) : (
          messages.map((msg) => (
            <Message
              key={msg._id?.toString()}
              msg={msg}
              isMine={msg.senderId === myId}
              onPlaySong={playSong}
              onViewPlaylist={(id) => navigate(`/playlist/${id}`)}
            />
          ))
        )}
        {otherTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
              {[0,1,2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 bg-gray-900/80 backdrop-blur p-3">
        <form onSubmit={sendText} className="flex items-center gap-2">
          <button type="button" onClick={() => setShowSongPicker(true)}
            className="w-9 h-9 flex-shrink-0 rounded-full bg-gray-800 hover:bg-amber-500/20 border border-gray-700 hover:border-amber-500/40 flex items-center justify-center transition-all text-gray-400 hover:text-amber-400">
            <FiMusic size={15} />
          </button>
          <button type="button" onClick={() => setShowPlaylistPicker(true)}
            className="w-9 h-9 flex-shrink-0 rounded-full bg-gray-800 hover:bg-violet-500/20 border border-gray-700 hover:border-violet-500/40 flex items-center justify-center transition-all text-gray-400 hover:text-violet-400">
            <MdOutlineLibraryMusic size={15} />
          </button>
          <input
            value={text} onChange={handleTextChange}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) sendText(e); }}
            placeholder="Message…"
            className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-full text-sm outline-none placeholder-gray-500 border border-gray-700 focus:border-amber-500/50 transition-colors"
          />
          <button type="submit" disabled={!text.trim()}
            className="w-9 h-9 flex-shrink-0 rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all">
            <FiSend size={15} className="text-gray-950" />
          </button>
        </form>
      </div>

      {showSongPicker    && <SongPicker     __URL__={__URL__} onSelect={handleSongSelect}    onClose={() => setShowSongPicker(false)} />}
      {showPlaylistPicker && <PlaylistPicker __URL__={__URL__} onSelect={handlePlaylistSelect} onClose={() => setShowPlaylistPicker(false)} />}
    </div>
  );
};

// ─── Conversation Item ────────────────────────────────────────────────────────
const ConvoItem = ({ convo, isActive, onSelect, isOnline }) => (
  <button onClick={() => onSelect(convo)}
    className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-colors text-left
      ${isActive ? "bg-amber-500/15 border border-amber-500/20" : "hover:bg-gray-800/60"}`}>
    <Av name={convo.otherUser?.fullName} online={isOnline(convo.otherUser?._id?.toString())} />
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-white text-sm truncate">{convo.otherUser?.fullName}</span>
        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{convo.lastMessage ? fmtTime(convo.lastMessage.sentAt) : ""}</span>
      </div>
      <div className="flex items-center justify-between mt-0.5">
        <p className="text-gray-400 text-xs truncate">{convo.lastMessage?.preview || "No messages yet"}</p>
        {convo.unreadCount > 0 && (
          <span className="flex-shrink-0 ml-2 bg-amber-500 text-gray-950 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {convo.unreadCount > 9 ? "9+" : convo.unreadCount}
          </span>
        )}
      </div>
    </div>
  </button>
);

// ─── Main Chat Page ───────────────────────────────────────────────────────────
const Chat = () => {
  const { __URL__ } = useContext(SongContext);
  const { isOnline } = useContext(SocketContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const myId = (() => {
    try { return JSON.parse(atob(localStorage.getItem("token")?.split(".")[1] || ""))?.id; } catch { return null; }
  })();

  const [conversations, setConversations] = useState([]);
  const [friends, setFriends]             = useState([]);
  const [activeConvo, setActiveConvo]     = useState(null);
  const [activeOther, setActiveOther]     = useState(null);
  const [sidebarTab, setSidebarTab]       = useState("chats"); // "chats" | "friends"
  const [loading, setLoading]             = useState(true);
  const [showChat, setShowChat]           = useState(false); // mobile: show chat panel

  const headers = { "x-auth-token": localStorage.getItem("token") };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [convRes, frRes] = await Promise.all([
        axios.get(`${__URL__}/api/v1/chat/conversations`, { headers }),
        axios.get(`${__URL__}/api/v1/follow/friends`, { headers }),
      ]);
      setConversations(convRes.data.conversations || []);
      setFriends(frRes.data.friends || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [__URL__]);

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/login"); return; }
    loadData();
  }, []);

  // Open conversation from URL param e.g. /chat?with=userId
  useEffect(() => {
    const withUserId = searchParams.get("with");
    if (withUserId && !loading) openWithUser(withUserId);
  }, [searchParams, loading]);

  const openWithUser = async (userId) => {
    try {
      const { data } = await axios.get(`${__URL__}/api/v1/chat/with/${userId}`, { headers });
      setActiveConvo(data.conversation);
      setActiveOther(data.otherUser);
      setShowChat(true);
      loadData();
    } catch (err) {
      alert(err.response?.data?.msg || "Cannot open chat");
    }
  };

  const selectConvo = (convo) => {
    setActiveConvo(convo);
    setActiveOther(convo.otherUser);
    setShowChat(true);
    // Mark as read locally
    setConversations((prev) => prev.map((c) => c._id === convo._id ? { ...c, unreadCount: 0 } : c));
  };

  const totalUnread = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0);

  return (
    <div className="flex h-[calc(100vh-56px)] bg-gray-950 text-white overflow-hidden">

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <div className={`${showChat ? "hidden lg:flex" : "flex"} flex-col w-full lg:w-80 xl:w-96 border-r border-gray-800 flex-shrink-0`}>

        {/* Sidebar Header */}
        <div className="px-4 pt-5 pb-3">
          <h1 className="text-xl font-black text-white">Messages</h1>
          {totalUnread > 0 && (
            <span className="text-xs text-amber-400">{totalUnread} unread</span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex px-3 gap-1 mb-3">
          {["chats","friends"].map((tab) => (
            <button key={tab} onClick={() => setSidebarTab(tab)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-colors
                ${sidebarTab === tab ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}>
              {tab === "chats" ? `Chats${totalUnread > 0 ? ` (${totalUnread})` : ""}` : `Friends (${friends.length})`}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sidebarTab === "chats" ? (
            conversations.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <p className="text-4xl">💬</p>
                <p className="text-gray-500 text-sm">No conversations yet.<br />Add friends to start chatting.</p>
                <button onClick={() => navigate("/people")} className="text-amber-400 text-sm hover:underline">
                  Find people →
                </button>
              </div>
            ) : conversations.map((c) => (
              <ConvoItem key={c._id} convo={c} isActive={activeConvo?._id === c._id} onSelect={selectConvo} isOnline={isOnline} />
            ))
          ) : (
            friends.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <p className="text-4xl">🤝</p>
                <p className="text-gray-500 text-sm">No friends yet.<br />Discover people and send requests.</p>
                <button onClick={() => navigate("/people")} className="text-amber-400 text-sm hover:underline">
                  Discover people →
                </button>
              </div>
            ) : friends.map((f) => (
              <button key={f._id} onClick={() => openWithUser(f._id?.toString())}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-gray-800/60 transition-colors text-left">
                <Av name={f.fullName} online={isOnline(f._id?.toString())} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{f.fullName}</p>
                  <p className={`text-xs ${isOnline(f._id?.toString()) ? "text-emerald-400" : "text-gray-500"}`}>
                    {isOnline(f._id?.toString()) ? "Online" : "Offline"}
                  </p>
                </div>
                <span className="text-xs text-gray-600 hover:text-amber-400 px-2 py-1 rounded-lg border border-gray-800 hover:border-amber-500/30 transition-colors">
                  Chat
                </span>
              </button>
            ))
          )}
        </div>

        {/* Find people CTA */}
        <div className="px-3 pb-4">
          <button onClick={() => navigate("/people")}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-400 hover:text-white text-sm transition-colors">
            <FiSearch size={14} />
            Find people
          </button>
        </div>
      </div>

      {/* ── Chat Window ───────────────────────────────────────────── */}
      <div className={`${showChat ? "flex" : "hidden lg:flex"} flex-1 flex-col`}>
        {activeConvo ? (
          <ChatWindow
            key={activeConvo._id}
            conversationId={activeConvo._id?.toString()}
            otherUser={activeOther}
            myId={myId}
            onBack={() => setShowChat(false)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
            <div className="w-20 h-20 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
              <FiMusic size={32} className="text-gray-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Your Music Chat</h2>
              <p className="text-gray-500 text-sm mt-2">Select a conversation or start one<br />by sharing a song with a friend.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;