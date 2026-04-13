import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

import { FetchContext } from "../Context/FetchContext";
import { SongContext } from "../Context/SongContext";
import PlaylistSong from "../components/PlaylistSong";

import { MdDeleteForever } from "react-icons/md";

const Playlist = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { fetchPlaylist } = useContext(FetchContext);
  const { __URL__ } = useContext(SongContext);

  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const headers = {
    "x-auth-token": token,
  };

  // ❌ Delete playlist
  const deletePlaylist = async () => {
    try {
      setLoading(true);

      const { status } = await axios.delete(
        `${__URL__}/api/v1/playlist/delete/${id}`,
        { headers }
      );

      if (status === 200) {
        alert("Playlist deleted");
        navigate("/playlists");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting playlist");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Delete this playlist?")) {
      deletePlaylist();
    }
  };

  // 📥 Get playlist
  const getPlaylist = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(
        `${__URL__}/api/v1/playlist/${id}`,
        { headers }
      );

      setPlaylist(data.playlist);
    } catch (err) {
      console.error(err);
      setPlaylist(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPlaylist();
  }, [fetchPlaylist]);

  if (loading) {
    return <div className="text-white p-5">Loading...</div>;
  }

  if (!playlist) {
    return <div className="text-white p-5">Playlist not found</div>;
  }

  return (
    <div className="bg-slate-800 text-white p-5 min-h-screen space-y-5 flex flex-col lg:items-center">

      {/* 🎵 Header */}
      <div className="flex justify-between items-center w-full lg:w-[70vw] mt-5">
        <div>
          <h2 className="text-xl lg:text-3xl font-semibold">
            {playlist.playlistName}
          </h2>
          <p>Songs - {playlist.songs.length}</p>
        </div>

        {/* ❌ Delete */}
        <button onClick={handleDelete}>
          <MdDeleteForever size={28} />
        </button>
      </div>

      {/* 🎧 Songs */}
      <div className="space-y-2 w-full lg:w-[70vw]">
        {playlist.songs.length === 0 ? (
          <p>No songs in this playlist</p>
        ) : (
          playlist.songs.map((song, index) => (
            <PlaylistSong
              key={index}
              title={song.title}
              artistName={song.artistName}
              fileId={song.fileId}
              playlistId={id}
            />
          ))
        )}
      </div>

    </div>
  );
};

export default Playlist;