import React, { useState, useContext } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { SongContext } from "../Context/SongContext";
import { FetchContext } from "../Context/FetchContext";
import { QueueContext } from "../Context/QueueContex";
import { CgPlayListAdd } from "react-icons/cg";
import { FiShare2 } from "react-icons/fi";
import playlist from "../assets/playlist.jpg";
import ShareModal from "./ShareModal";

const PlaylistCard = ({ playlistName, playlistId, noSongs }) => {
  const { setFetchPlaylist } = useContext(FetchContext);
  const { __URL__ } = useContext(SongContext);
  const { list, dispatchList } = useContext(QueueContext);

  const [loading,   setLoading]   = useState(false);
  const [showShare, setShowShare] = useState(false);

  const addSongToPlaylist = async () => {
    if (list.length === 0) return alert("Please select a song first");
    try {
      setLoading(true);
      const headers = { "x-auth-token": localStorage.getItem("token") };
      const { status } = await axios.post(
        `${__URL__}/api/v1/playlist/add/${playlistId}`,
        { song: list[0] },
        { headers }
      );
      if (status === 200) {
        alert("Song added to playlist");
        setFetchPlaylist((prev) => !prev);
        dispatchList({ type: "REMOVE_SONG", payload: list[0].title });
      }
    } catch (err) {
      console.error(err);
      alert("Error adding song");
    } finally {
      setLoading(false);
    }
  };

  const sharePayload = {
    playlistId,
    playlistName,
    songCount: noSongs,
  };

  return (
    <>
      <div className="flex items-center justify-between py-3 px-1 border-b transition-colors"
        style={{ borderColor: "var(--border)", color: "var(--text-1)" }}>

        <Link to={`/playlist/${playlistId}`} className="flex items-center gap-4 flex-1 min-w-0 group">
          <img src={playlist} alt="playlist"
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0 group-hover:opacity-80 transition-opacity" />
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate group-hover:opacity-80 transition-opacity"
              style={{ color: "var(--text-1)" }}>
              {playlistName}
            </p>
            <p className="text-xs" style={{ color: "var(--text-2)" }}>
              {noSongs} {noSongs === 1 ? "song" : "songs"}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <button onClick={addSongToPlaylist} disabled={loading} title="Add selected song"
            className="p-2 rounded-lg hover:opacity-70 transition-opacity disabled:opacity-30"
            style={{ color: "var(--text-2)" }}>
            <CgPlayListAdd size={24} />
          </button>

          <button
            onClick={() => setShowShare(true)}
            title="Share playlist with friend"
            className="p-2 rounded-lg transition-all hover:opacity-80"
            style={{ color: "#a78bfa", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}
          >
            <FiShare2 size={16} />
          </button>
        </div>
      </div>

      {showShare && (
        <ShareModal
          type="playlist"
          payload={sharePayload}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  );
};

export default PlaylistCard;