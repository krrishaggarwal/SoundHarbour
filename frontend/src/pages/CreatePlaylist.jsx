import React, { useEffect, useContext, useState } from "react";
import axios from "axios";
import PlaylistCard from "../components/PlaylistCard";

// Context
import { SidebarContext } from "../Context/SibebarContext";
import { FetchContext } from "../Context/FetchContext";
import { SongContext } from "../Context/SongContext";

// Icons
import { GrFormAdd } from "react-icons/gr";

const CreatePlaylist = () => {
  const { fetchPlaylist } = useContext(FetchContext);
  const { showMenu, setShowMenu } = useContext(SidebarContext);
  const { __URL__ } = useContext(SongContext);

  const [showCreate, setShowCreate] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playlistName, setPlaylistName] = useState("");

  const token = localStorage.getItem("token");

  const headers = {
    "x-auth-token": token,
  };

  // ➕ Create playlist
  const createPlaylist = async () => {
    try {
      if (!token) return alert("Please login");

      if (!playlistName.trim()) {
        return alert("Enter playlist name");
      }

      const { status } = await axios.post(
        `${__URL__}/api/v1/playlist/create`,
        { playlistName },
        { headers }
      );

      if (status === 201) {
        alert("Playlist created");
        setShowCreate(false);
        setPlaylistName("");
        fetchPlaylists();
      }
    } catch (err) {
      console.error(err);
      alert("Error creating playlist");
    }
  };

  // 📥 Fetch playlists
  const fetchPlaylists = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(
        `${__URL__}/api/v1/playlist`,
        { headers }
      );

      setPlaylists(data.playlists || []);
    } catch (err) {
      console.error(err);
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showMenu) setShowMenu(false);
    fetchPlaylists();
  }, [fetchPlaylist]);

  return (
    <div className="bg-slate-800 text-white flex flex-col p-5 space-y-6 min-h-screen pb-32">

      <h1 className="text-2xl font-semibold">All Playlists</h1>

      {/* 🎵 Playlist List */}
      {loading ? (
        <p>Loading...</p>
      ) : playlists.length > 0 ? (
        playlists.map((playlist) => (
          <PlaylistCard
            key={playlist._id}
            playlistName={playlist.playlistName}
            playlistId={playlist._id}
            noSongs={playlist.songs.length}
          />
        ))
      ) : (
        <p className="text-center text-lg">No Playlists Found</p>
      )}

      {/* ➕ Floating Button */}
      <div
        onClick={() => setShowCreate(true)}
        className="bg-yellow-400 fixed bottom-20 right-5 px-3 py-2 rounded-lg flex items-center space-x-1 cursor-pointer text-black"
      >
        <GrFormAdd />
        <span>Create</span>
      </div>

      {/* 🧾 Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center">

          <div className="bg-white p-6 rounded-lg space-y-4 w-[300px]">

            <button
              onClick={() => setShowCreate(false)}
              className="text-black float-right"
            >
              ✖
            </button>

            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="Playlist name"
              className="w-full p-2 border-b text-black outline-none"
            />

            <button
              onClick={createPlaylist}
              className="bg-yellow-400 px-4 py-2 rounded text-black w-full"
            >
              Create
            </button>

          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePlaylist;