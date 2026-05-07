import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SongContext } from "../Context/SongContext";
import { QueueContext } from "../Context/QueueContex";
import { SlOptionsVertical } from "react-icons/sl";
import { MdOutlinePlaylistAdd, MdQueuePlayNext } from "react-icons/md";
import { FiShare2 } from "react-icons/fi";
import musicbg from "../assets/musicbg.jpg";
import ShareModal from "./ShareModal";

const SongCard = ({ title, artistName, fileId, songId }) => {
  const { audio, __URL__, setSongName, setSongArtist, setSongUrl, setIsPlaying } = useContext(SongContext);
  const { dispatchQueue, dispatchList } = useContext(QueueContext);
  const navigate = useNavigate();

  const [showOptions, setShowOptions] = useState(false);
  const [showShare,   setShowShare]   = useState(false);

  const handlePlay = () => {
    try {
      if (!audio) return;
      audio.pause();
      audio.src = `${__URL__}/api/v1/song/stream/id/${fileId}`;
      setSongName(title);
      setSongArtist(artistName);
      setSongUrl(fileId);
      audio.load();
      audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToPlaylist = () => {
    dispatchList({ type: "ADD_SONG", payload: { title, artistName, fileId } });
    navigate("/playlists");
  };

  const handlePlayNext = () => {
    dispatchQueue({ type: "ADD_TO_QUEUE", payload: { title, artistName, fileId } });
  };

  const sharePayload = { title, artist: artistName, fileId, songId };

  return (
    <>
      <div className="flex items-center justify-between border-b p-3 lg:w-[70vw] mx-auto transition-colors hover:opacity-90"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-1)" }}>

        <div onClick={handlePlay} className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
          <img src={musicbg} alt="song" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: "var(--text-1)" }}>{title}</p>
            <p className="text-xs truncate" style={{ color: "var(--text-2)" }}>by {artistName}</p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
          <button onClick={handleAddToPlaylist} title="Add to playlist"
            className="p-2 rounded-lg hover:opacity-70 transition-opacity"
            style={{ color: "var(--text-2)" }}>
            <MdOutlinePlaylistAdd size={22} />
          </button>
          <button onClick={handlePlayNext} title="Play next"
            className="p-2 rounded-lg hover:opacity-70 transition-opacity"
            style={{ color: "var(--text-2)" }}>
            <MdQueuePlayNext size={20} />
          </button>
          <button onClick={() => setShowShare(true)} title="Share with friend"
            className="p-2 rounded-lg transition-all hover:opacity-80"
            style={{ color: "var(--accent)", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <FiShare2 size={16} />
          </button>
        </div>

        <div className="relative lg:hidden flex-shrink-0">
          <button onClick={() => setShowOptions(!showOptions)} className="p-2"
            style={{ color: "var(--text-2)" }}>
            <SlOptionsVertical size={16} />
          </button>
          {showOptions && (
            <div className="absolute right-0 top-full mt-1 w-44 rounded-xl shadow-xl z-20 py-1 overflow-hidden"
              style={{ background: "var(--bg-raised)", border: "1px solid var(--border-md)" }}>
              {[
                { label: "Add to playlist", fn: handleAddToPlaylist },
                { label: "Play next",       fn: handlePlayNext },
                { label: "Share with friend", fn: () => { setShowShare(true); setShowOptions(false); }, accent: true },
              ].map(({ label, fn, accent }) => (
                <button key={label} onClick={fn}
                  className="flex items-center w-full px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                  style={{ color: accent ? "var(--accent)" : "var(--text-1)" }}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showShare && (
        <ShareModal
          type="song"
          payload={sharePayload}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  );
};

export default SongCard;