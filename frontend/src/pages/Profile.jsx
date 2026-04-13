import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { SongContext } from "../Context/SongContext";

import { HiOutlineMusicNote } from "react-icons/hi";
import { MdOutlineLibraryMusic, MdPlayArrow } from "react-icons/md";
import { BsHeadphones, BsCalendar3, BsClock, BsGlobe2, BsLockFill } from "react-icons/bs";
import { FiPlay, FiCopy, FiExternalLink, FiCheck } from "react-icons/fi";
import { CgPlayListAdd } from "react-icons/cg";
import musicbg from "../assets/musicbg.jpg";
import playlist from "../assets/playlist.jpg";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const timeAgo = (date) => {
  const s = Math.floor((new Date() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const memberSince = (d) =>
  new Date(d).toLocaleDateString("en-US", { month: "long", year: "numeric" });

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ name, size = "lg" }) => {
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
  const grad = palette[initials.charCodeAt(0) % palette.length];
  const sz =
    size === "lg" ? "w-24 h-24 text-3xl" : size === "sm" ? "w-10 h-10 text-sm" : "w-14 h-14 text-lg";
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${grad} flex items-center justify-center font-bold text-white shadow-lg flex-shrink-0`}>
      {initials}
    </div>
  );
};

// ─── Privacy Toggle ───────────────────────────────────────────────────────────
const PrivacyToggle = ({ isPublic, userId, __URL__, onChange }) => {
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggle = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const { data } = await axios.put(
        `${__URL__}/api/v1/user/privacy`,
        { isPublic: !isPublic },
        { headers: { "x-auth-token": token } }
      );
      onChange(data.isPublic);
    } catch (err) {
      alert("Failed to update privacy setting");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}/user/${userId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-gray-900/80 border border-gray-700/60 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isPublic ? (
            <BsGlobe2 size={16} className="text-emerald-400" />
          ) : (
            <BsLockFill size={16} className="text-gray-400" />
          )}
          <h3 className="text-sm font-semibold text-white">Profile Visibility</h3>
        </div>

        {/* Toggle switch */}
        <button
          onClick={toggle}
          disabled={saving}
          aria-label="Toggle profile visibility"
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none
            ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            ${isPublic ? "bg-emerald-500" : "bg-gray-600"}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300
              ${isPublic ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>
      </div>

      {/* Status description */}
      <div className={`rounded-xl px-4 py-3 text-sm transition-colors ${
        isPublic
          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
          : "bg-gray-800/60 border border-gray-700/40 text-gray-400"
      }`}>
        {isPublic ? (
          <p>
            <span className="font-semibold">Public</span> — anyone with the link
            can view your profile, top songs, and playlists.
          </p>
        ) : (
          <p>
            <span className="font-semibold">Private</span> — only you can see
            your profile. No one else can find it.
          </p>
        )}
      </div>

      {/* Public-only actions */}
      {isPublic && userId && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={copyLink}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${copied
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"
              }`}
          >
            {copied ? <FiCheck size={13} /> : <FiCopy size={13} />}
            {copied ? "Copied!" : "Copy link"}
          </button>

          <Link
            to={`/user/${userId}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 transition-colors"
          >
            <FiExternalLink size={13} />
            Preview
          </Link>
        </div>
      )}
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="relative bg-gray-800/60 border border-gray-700/50 rounded-2xl p-5 backdrop-blur-sm overflow-hidden hover:border-amber-500/30 transition-all duration-300 group">
    <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
    <div className={`text-2xl mb-2 ${accent.split(" ")[0].replace("from-", "text-")}`}>
      <Icon size={26} />
    </div>
    <p className="text-3xl font-bold text-white">{value}</p>
    <p className="text-gray-400 text-sm mt-1">{label}</p>
  </div>
);

// ─── Top Song Row ─────────────────────────────────────────────────────────────
const TopSongRow = ({ rank, title, artist, count, onPlay }) => (
  <div onClick={onPlay} className="flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-gray-800/60 transition-all group cursor-pointer">
    <span className="text-gray-600 text-sm w-5 text-center font-mono">{rank}</span>
    <img src={musicbg} alt={title} className="w-11 h-11 rounded-lg object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
    <div className="flex-1 min-w-0">
      <p className="text-white text-sm font-medium truncate">{title}</p>
      <p className="text-gray-400 text-xs truncate">{artist}</p>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 hidden sm:block">{count} {count === 1 ? "play" : "plays"}</span>
      <div className="w-7 h-7 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <FiPlay size={12} className="text-amber-400 ml-0.5" />
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Profile = () => {
  const { audio, __URL__, setSongName, setSongArtist, setSongUrl, setIsPlaying } = useContext(SongContext);
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [topSongs, setTopSongs] = useState([]);
  const [recent, setRecent] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const headers = { "x-auth-token": token };

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [profRes, topRes, recentRes, plRes] = await Promise.all([
        axios.get(`${__URL__}/api/v1/user/profile`, { headers }),
        axios.get(`${__URL__}/api/v1/user/top-songs`, { headers }),
        axios.get(`${__URL__}/api/v1/user/recent`, { headers }),
        axios.get(`${__URL__}/api/v1/user/playlists-summary`, { headers }),
      ]);
      setUser(profRes.data.user);
      setTopSongs(topRes.data.topSongs || []);
      setRecent(recentRes.data.recent || []);
      setPlaylists(plRes.data.playlists || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const playSong = (fileId, title, artist) => {
    if (!audio) return;
    audio.pause();
    audio.src = `${__URL__}/api/v1/song/stream/id/${fileId}`;
    setSongName(title); setSongArtist(artist); setSongUrl(fileId);
    audio.load(); audio.play(); setIsPlaying(true);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading profile…</p>
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
      Could not load profile.
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-32">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-gray-900/50 to-gray-950" />
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-amber-500/8 rounded-full blur-3xl" />
        <div className="absolute top-10 right-1/4 w-56 h-56 bg-orange-600/6 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-5 pt-10 pb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            <Avatar name={user.fullName} size="lg" />
            <div className="flex-1 text-center sm:text-left">
              <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-1">
                {user.role === "admin" ? "⚡ Admin" : "Listener"}
              </p>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none">
                {user.fullName}
              </h1>
              <p className="text-gray-400 mt-2 text-sm">{user.email}</p>
              {user.createdAt && (
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-gray-500 text-xs mt-2">
                  <BsCalendar3 size={11} />
                  <span>Member since {memberSince(user.createdAt)}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Link to="/explore" className="px-4 py-2 bg-amber-400 text-gray-950 text-sm font-bold rounded-full hover:bg-amber-300 transition-colors">
                Browse Songs
              </Link>
              <Link to="/playlists" className="px-4 py-2 bg-gray-800 text-white text-sm font-semibold rounded-full hover:bg-gray-700 transition-colors border border-gray-700">
                Playlists
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-5 mt-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={BsHeadphones} label="Total Plays" value={user.totalPlays ?? 0} accent="from-amber-400 to-orange-500" />
          <StatCard icon={MdOutlineLibraryMusic} label="Playlists" value={user.playlistCount ?? 0} accent="from-emerald-400 to-teal-600" />
          <StatCard icon={HiOutlineMusicNote} label="Unique Songs" value={topSongs.length > 0 ? `${topSongs.length}+` : 0} accent="from-violet-400 to-purple-600" />
          <StatCard icon={BsClock} label="Recent Sessions" value={recent.length} accent="from-sky-400 to-blue-600" />
        </div>
      </div>

      {/* ── Main Grid ────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-5 mt-8 grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left column */}
        <div className="lg:col-span-3 space-y-6">

          {/* Most Played */}
          <section className="bg-gray-900/70 border border-gray-800/60 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">🎧 Most Played</h2>
              <span className="text-xs text-gray-500">All time</span>
            </div>
            {topSongs.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-3 text-center">
                <BsHeadphones size={36} className="text-gray-700" />
                <p className="text-gray-500 text-sm">No plays yet — start listening!</p>
                <Link to="/explore" className="text-amber-400 text-sm hover:underline">Explore songs →</Link>
              </div>
            ) : (
              <div className="space-y-1">
                {topSongs.map((s, i) => (
                  <TopSongRow key={s.fileId} rank={i + 1} title={s.title} artist={s.artist} count={s.count} onPlay={() => playSong(s.fileId, s.title, s.artist)} />
                ))}
              </div>
            )}
          </section>

          {/* Recent Activity */}
          <section className="bg-gray-900/70 border border-gray-800/60 rounded-2xl p-5">
            <h2 className="text-lg font-bold text-white mb-4">🕓 Recently Played</h2>
            {recent.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No recent activity yet.</p>
            ) : (
              <div className="space-y-1">
                {recent.map((r, i) => (
                  <div key={i} onClick={() => playSong(r.fileId, r.title, r.artist)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800/60 transition-all cursor-pointer group">
                    <img src={musicbg} alt={r.title} className="w-9 h-9 rounded-lg object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{r.title}</p>
                      <p className="text-gray-500 text-xs truncate">{r.artist}</p>
                    </div>
                    <span className="text-gray-600 text-xs flex-shrink-0">{timeAgo(r.playedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">

          {/* ── Privacy Toggle ─────────────────────────────────────── */}
          <PrivacyToggle
            isPublic={user.isPublic}
            userId={user._id?.toString()}
            __URL__={__URL__}
            onChange={(val) => setUser((u) => ({ ...u, isPublic: val }))}
          />

          {/* Playlists */}
          <section className="bg-gray-900/70 border border-gray-800/60 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">🎵 Your Playlists</h2>
              <Link to="/playlists" className="text-amber-400 text-xs hover:underline">Manage →</Link>
            </div>
            {playlists.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-3 text-center">
                <MdOutlineLibraryMusic size={36} className="text-gray-700" />
                <p className="text-gray-500 text-sm">No playlists yet.</p>
                <Link to="/playlists" className="flex items-center gap-1.5 text-amber-400 text-sm hover:underline">
                  <CgPlayListAdd size={16} />Create one
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {playlists.map((pl) => (
                  <Link key={pl._id} to={`/playlist/${pl._id}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-800/60 transition-all group">
                    <div className="relative">
                      <img src={playlist} alt={pl.playlistName} className="w-11 h-11 rounded-lg object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 bg-black/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <MdPlayArrow size={18} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{pl.playlistName}</p>
                      <p className="text-gray-500 text-xs">{pl.songs.length} {pl.songs.length === 1 ? "song" : "songs"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Vibe card */}
          <div className="bg-gradient-to-br from-amber-500/15 to-orange-600/10 border border-amber-500/20 rounded-2xl p-5">
            <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-2">Your Vibe</p>
            {user.totalPlays === 0 ? (
              <><p className="text-white font-bold text-lg leading-tight">Start Your Journey</p><p className="text-gray-400 text-sm mt-1">Play songs to build your music profile.</p></>
            ) : user.totalPlays < 10 ? (
              <><p className="text-white font-bold text-lg leading-tight">Just Getting Started</p><p className="text-gray-400 text-sm mt-1">{user.totalPlays} plays so far — keep exploring!</p></>
            ) : user.totalPlays < 50 ? (
              <><p className="text-white font-bold text-lg leading-tight">Regular Listener 🎵</p><p className="text-gray-400 text-sm mt-1">{user.totalPlays} plays — you're getting into it.</p></>
            ) : (
              <><p className="text-white font-bold text-lg leading-tight">Music Obsessive 🔥</p><p className="text-gray-400 text-sm mt-1">{user.totalPlays} plays — seriously dedicated.</p></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;