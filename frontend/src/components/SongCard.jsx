import React, { useContext, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { SongContext } from "../Context/SongContext";
import { FetchContext } from "../Context/FetchContext";
import { QueueContext } from "../Context/QueueContex";
import { SlOptionsVertical } from "react-icons/sl";
import { MdOutlinePlaylistAdd, MdQueuePlayNext } from "react-icons/md";
import musicbg from "../assets/musicbg.jpg";

const SongCard = ({ title, artistName, fileId, songId }) => {
  const {
    audio,
    __URL__,
    setSongName,
    setSongArtist,
    setSongUrl,
    setIsPlaying,
  } = useContext(SongContext);
  const { setFetchSong } = useContext(FetchContext);
  const { dispatchQueue, dispatchList } = useContext(QueueContext);
  const navigate = useNavigate();
  const [showOptions, setShowOptions] = useState(false);

  // Track play in history (fire-and-forget)
  const trackPlay = () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios
      .post(
        `${__URL__}/api/v1/user/play`,
        { songId, title, artist: artistName, fileId },
        { headers: { "x-auth-token": token } }
      )
      .catch(() => { }); // silently ignore tracking errors
  };

  const handlePlay = () => {
    console.log("Playing fileId:", fileId);
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
      trackPlay();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToPlaylist = () => {
    dispatchList({ type: "ADD_SONG", payload: { title, artistName, fileId } });
    navigate("/playlists");
  };

  const handlePlayNext = () => {
    dispatchQueue({
      type: "ADD_TO_QUEUE",
      payload: { title, artistName, fileId },
    });
  };

  return (
    <div className="flex bg-gray-800 text-white justify-between items-center border-b border-gray-700 p-2 lg:w-[70vw] mx-auto hover:bg-gray-750 transition-colors">
      <div onClick={handlePlay} className="flex space-x-4 cursor-pointer">
        <img src={musicbg} alt="song" className="w-14 h-14 object-cover" />
        <div>
          <div>{title}</div>
          <div className="text-gray-400">by- {artistName}</div>
        </div>
      </div>

      <div className="hidden lg:flex items-center space-x-4">
        <button onClick={handleAddToPlaylist}>
          <MdOutlinePlaylistAdd size={28} />
        </button>
        <button onClick={handlePlayNext}>
          <MdQueuePlayNext size={25} />
        </button>
      </div>

      <div className="relative lg:hidden">
        <button onClick={() => setShowOptions(!showOptions)}>
          <SlOptionsVertical size={18} />
        </button>
        {showOptions && (
          <div className="absolute right-0 bg-gray-900 p-2 space-y-2 z-10">
            <button onClick={handleAddToPlaylist}>Add to playlist</button>
            <button onClick={handlePlayNext}>Play next</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SongCard;
