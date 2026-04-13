import React, { useState, useContext } from "react";
import axios from "axios";
import { SongContext } from "../Context/SongContext";
import playlist from "../assets/playlist.jpg";
import { CgPlayListAdd } from "react-icons/cg";
import { Link } from "react-router-dom";
import { FetchContext } from "../Context/FetchContext";
import { QueueContext } from "../Context/QueueContex";

const PlaylistCard = ({ playlistName, playlistId, noSongs }) => {
  const { setFetchPlaylist } = useContext(FetchContext);
  const { __URL__ } = useContext(SongContext);
  const { list, dispatchList } = useContext(QueueContext);

  const [loading, setLoading] = useState(false);

  // ➕ Add song to playlist
  const addSongToPlaylist = async () => {
    try {
      if (list.length === 0) {
        return alert("Please select a song");
      }

      setLoading(true);

      const headers = {
        "x-auth-token": localStorage.getItem("token"),
      };

      // ✅ send only ONE song (backend expects { song })
      const { status } = await axios.post(
        `${__URL__}/api/v1/playlist/add/${playlistId}`,
        {
          song: list[0],
        },
        { headers }
      );

      if (status === 200) {
        alert("Song added to playlist");

        setFetchPlaylist((prev) => !prev);

        // remove from queue
        dispatchList({
          type: "REMOVE_SONG",
          payload: list[0].title,
        });
      }

    } catch (err) {
      console.error(err);
      alert("Error adding song");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex border-b-2 pb-4 items-center justify-between">

      {/* 🎵 Playlist Info */}
      <Link to={`/playlist/${playlistId}`} className="flex space-x-5">
        <img src={playlist} alt="playlist" className="w-20 h-20 object-cover" />
        <div>
          <p className="font-semibold">{playlistName}</p>
          <p className="text-gray-500">Songs - {noSongs}</p>
        </div>
      </Link>

      {/* ➕ Add Button */}
      <button
        onClick={addSongToPlaylist}
        disabled={loading}
        className="hover:scale-110 transition"
      >
        <CgPlayListAdd size={35} />
      </button>

    </div>
  );
};

export default PlaylistCard;