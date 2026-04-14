import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";
import { SongContext } from "../Context/SongContext";
import { SocketContext } from "../Context/SocketContext";

import { BsHeadphones, BsCalendar3, BsLockFill, BsGlobe2 } from "react-icons/bs";
import { MdOutlineLibraryMusic, MdPlayArrow } from "react-icons/md";
import { FiPlay, FiUserPlus, FiUserCheck, FiUserX, FiMessageCircle } from "react-icons/fi";
import musicbg from "../assets/musicbg.jpg";
import playlist_img from "../assets/playlist.jpg";

const memberSince = (d) => new Date(d).toLocaleDateString("en-US", { month: "long", year: "numeric" });

const Avatar = ({ name }) => {
  const initials = name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";
  const palette = ["from-amber-400 to-orange-500","from-emerald-400 to-teal-600","from-violet-400 to-purple-600","from-rose-400 to-pink-600","from-sky-400 to-blue-600"];
  const g = palette[initials.charCodeAt(0) % palette.length];
  return (
    <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${g} flex items-center justify-center text-3xl font-bold text-white shadow-lg flex-shrink-0`}>
      {initials}
    </div>
  );
};

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

const PublicProfile = () => {
  const { userId } = useParams();
  const { audio, __URL__, setSongName, setSongArtist, setSongUrl, setIsPlaying } = useContext(SongContext);
  const { isOnline } = useContext(SocketContext);
  const navigate = useNavigate();

  const [data,         setData]         = useState(null);
  const [status,       setStatus]       = useState("loading");
  const [relationship, setRelationship] = useState(null);
  const [relLoading,   setRelLoading]   = useState(false);

  const token   = localStorage.getItem("token");
  const headers = { "x-auth-token": token };

  useEffect(() => {
    axios.get(`${__URL__}/api/v1/user/public/${userId}`)
      .then((r) => { setData(r.data); setStatus("ok"); })
      .catch((err) => setStatus(err.response?.status === 403 ? "private" : "notfound"));

    if (token) {
      axios.get(`${__URL__}/api/v1/follow/status/${userId}`, { headers })
        .then((r) => setRelationship(r.data))
        .catch(() => {});
    }
  }, [userId]);

  const refreshRel = async () => {
    const { data: r } = await axios.get(`${__URL__}/api/v1/follow/status/${userId}`, { headers });
    setRelationship(r);
  };

  const follow      = async () => { setRelLoading(true); await axios.post(`${__URL__}/api/v1/follow/${userId}`,        {}, { headers }); await refreshRel(); setRelLoading(false); };
  const unfollow    = async () => { setRelLoading(true); await axios.delete(`${__URL__}/api/v1/follow/${userId}`,         { headers }); await refreshRel(); setRelLoading(false); };
  const sendReq     = async () => { setRelLoading(true); await axios.post(`${__URL__}/api/v1/follow/request/${userId}`, {}, { headers }); await refreshRel(); setRelLoading(false); };
  const cancelReq   = async () => { setRelLoading(true); await axios.delete(`${__URL__}/api/v1/follow/request/${userId}`,  { headers }); await refreshRel(); setRelLoading(false); };
  const removeFriend= async () => { setRelLoading(true); await axios.delete(`${__URL__}/api/v1/follow/friend/${userId}`,   { headers }); await refreshRel(); setRelLoading(false); };

  const playSong = (song) => {
    if (!audio) return;
    audio.pause();
    audio.src = `${__URL__}/api/v1/song/stream/id/${song.fileId}`;
    setSongName(song.title); setSongArtist(song.artist); setSongUrl(song.fileId);
    audio.load(); audio.play(); setIsPlaying(true);
  };

  // ── States ────────────────────────────────────────────────────────────────
  if (status === "loading") return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (status === "private") return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
      <div className="text-center space-y-5 max-w-sm">
        <div className="w-20 h-20 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mx-auto">
          <BsLockFill size={32} className="text-gray-500" />
        </div>
        <h1 className="text-2xl font-bold text-white">Private Profile</h1>
        <p className="text-gray-400 text-sm leading-relaxed">This user has set their profile to private.</p>
        <Link to="/explore" className="inline-block bg-amber-400 text-gray-950 font-semibold px-6 py-2.5 rounded-full hover:bg-amber-300 transition-colors text-sm">
          Browse Songs
        </Link>
      </div>
    </div>
  );

  if (status !== "ok") return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
      <div className="text-center space-y-4"><p className="text-5xl">🎵</p>
        <h1 className="text-2xl font-bold text-white">User Not Found</h1>
        <Link to="/" className="inline-block text-amber-400 text-sm hover:underline">Go Home</Link>
      </div>
    </div>
  );

  const { user, topSongs, playlists } = data;
  const rel = relationship;
  const isFriend  = rel?.isFriend;
  const isPending = rel?.friendRequest?.status === "pending";
  const iSent     = rel?.friendRequest && rel.friendRequest.senderId !== userId;
  const userOnline = isOnline(userId);

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-32">

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/8 via-gray-900/50 to-gray-950" />
        <div className="absolute top-0 left-1/3 w-64 h-64 bg-violet-500/8 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-5 pt-12 pb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative">
              <Avatar name={user.fullName} />
              {userOnline && <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-gray-950" />}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full mb-3">
                <BsGlobe2 size={11} />
                {userOnline ? "Online" : "Public Profile"}
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none">{user.fullName}</h1>
              {user.createdAt && (
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-gray-500 text-xs mt-3">
                  <BsCalendar3 size={11} />
                  <span>Member since {memberSince(user.createdAt)}</span>
                </div>
              )}

              {/* Social buttons */}
              {token && (
                <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                  {isFriend ? (
                    <>
                      <button onClick={() => navigate(`/chat?with=${userId}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500/15 text-amber-400 border border-amber-500/25 rounded-full text-sm font-semibold hover:bg-amber-500/25 transition-colors">
                        <FiMessageCircle size={14} /> Message
                      </button>
                      <button onClick={removeFriend} disabled={relLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-400 border border-gray-700 rounded-full text-sm hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-colors">
                        <FiUserX size={14} /> Remove Friend
                      </button>
                    </>
                  ) : isPending ? (
                    iSent ? (
                      <button onClick={cancelReq} disabled={relLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-400 border border-gray-700 rounded-full text-sm hover:bg-gray-700 transition-colors">
                        <FiUserCheck size={14} /> Request Sent
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={sendReq} disabled={relLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded-full text-sm font-semibold hover:bg-emerald-500/25 transition-colors">
                          Accept Request
                        </button>
                        <button onClick={cancelReq} disabled={relLoading}
                          className="px-4 py-2 bg-gray-800 text-gray-400 border border-gray-700 rounded-full text-sm hover:bg-gray-700 transition-colors">
                          Decline
                        </button>
                      </div>
                    )
                  ) : (
                    <button onClick={sendReq} disabled={relLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-violet-500/15 text-violet-400 border border-violet-500/25 rounded-full text-sm font-semibold hover:bg-violet-500/25 transition-colors">
                      <FiUserPlus size={14} /> Add Friend
                    </button>
                  )}

                  <button onClick={rel?.isFollowing ? unfollow : follow} disabled={relLoading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition-colors
                      ${rel?.isFollowing
                        ? "bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                        : "bg-sky-500/15 text-sky-400 border-sky-500/25 hover:bg-sky-500/25"}`}>
                    {rel?.isFollowing ? <><FiUserCheck size={14} /> Following</> : <><FiUserPlus size={14} /> Follow</>}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-6 sm:ml-[7.5rem]">
            <div className="text-center"><p className="text-2xl font-bold text-white">{user.totalPlays ?? 0}</p><p className="text-gray-500 text-xs">Plays</p></div>
            <div className="w-px h-8 bg-gray-800" />
            <div className="text-center"><p className="text-2xl font-bold text-white">{user.playlistCount ?? 0}</p><p className="text-gray-500 text-xs">Playlists</p></div>
            <div className="w-px h-8 bg-gray-800" />
            <div className="text-center"><p className="text-2xl font-bold text-white">{topSongs.length}</p><p className="text-gray-500 text-xs">Top Songs</p></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-5 mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <section className="lg:col-span-3 bg-gray-900/70 border border-gray-800/60 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-4">🎧 Top Songs</h2>
          {topSongs.length === 0
            ? <div className="text-center py-10"><BsHeadphones size={36} className="text-gray-700 mx-auto mb-3" /><p className="text-gray-500 text-sm">No listening history yet.</p></div>
            : <div className="space-y-1">{topSongs.map((s, i) => <TopSongRow key={s.fileId} rank={i + 1} title={s.title} artist={s.artist} count={s.count} onPlay={() => playSong(s)} />)}</div>
          }
        </section>

        <section className="lg:col-span-2 bg-gray-900/70 border border-gray-800/60 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-4">🎵 Playlists</h2>
          {playlists.length === 0
            ? <div className="text-center py-8"><MdOutlineLibraryMusic size={36} className="text-gray-700 mx-auto mb-3" /><p className="text-gray-500 text-sm">No playlists.</p></div>
            : <div className="space-y-2">{playlists.map((pl) => (
              <div key={pl._id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-800/40 border border-gray-700/30">
                <img src={playlist_img} alt={pl.playlistName} className="w-11 h-11 rounded-lg object-cover opacity-80" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{pl.playlistName}</p>
                  <p className="text-gray-500 text-xs">{pl.songs.length} songs</p>
                </div>
              </div>
            ))}</div>
          }
        </section>
      </div>

      {!token && (
        <div className="max-w-4xl mx-auto px-5 mt-8">
          <div className="flex items-center justify-between bg-gray-900/50 border border-gray-800/60 rounded-2xl px-6 py-4">
            <p className="text-gray-400 text-sm">Want your own music profile?</p>
            <Link to="/register" className="bg-amber-400 text-gray-950 font-bold text-sm px-5 py-2 rounded-full hover:bg-amber-300 transition-colors">
              Join SoundHarbour
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicProfile;