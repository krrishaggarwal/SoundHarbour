import React, { useContext } from "react";
import axios from "axios";
import { SongContext } from "../Context/SongContext";
import musicbg from "../assets/musicbg.jpg";
import { CgRemoveR } from "react-icons/cg";
import { FetchContext } from "../Context/FetchContext";

const PlaylistSong = ({ title, artistName, fileId, playlistId }) => {
  const { audio, __URL__, setSongName, setSongArtist, setSongUrl, setIsPlaying } = useContext(SongContext);
  const { setFetchPlaylist } = useContext(FetchContext);

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
      console.error("Play error:", err);
    }
  };

  const headers = {
    "x-auth-token": localStorage.getItem("token"),
  };

  const removeSong = async () => {
    try {
      const { status } = await axios.delete(
        `${__URL__}/api/v1/playlist/remove/${playlistId}`,
        {
          headers,
          data: { title },
        }
      );
      if (status === 200) {
        alert("Song removed from playlist");
        setFetchPlaylist((prev) => !prev);
      }
    } catch (err) {
      console.error(err);
      alert("Error removing song");
    }
  };

  return (
    <div className="flex bg-gray-800 text-white justify-between items-center border-b p-2 lg:w-[70vw] mx-auto">
      <div onClick={handlePlay} className="flex space-x-4 cursor-pointer">
        <img src={musicbg} alt="song" className="w-14 h-14 object-cover" />
        <div className="text-sm lg:text-lg">
          <div>{title}</div>
          <div className="text-gray-400">{artistName}</div>
        </div>
      </div>

      <button onClick={removeSong}>
        <CgRemoveR size={25} />
      </button>
    </div>
  );
};

export default PlaylistSong;