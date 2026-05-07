import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { SidebarContext } from "../Context/SibebarContext";
import { useNavigate } from "react-router-dom";
import { SongContext } from "../Context/SongContext";
import { FetchContext } from "../Context/FetchContext";
import AdminSongCard from "../components/AdminSongCard";

const UploadSong = () => {
  const [genre, setGenre] = useState("");
  const navigate = useNavigate();
  const { showMenu, setShowMenu } = useContext(SidebarContext);
  const { __URL__ } = useContext(SongContext);
  const { fetchSong, setFetchSong } = useContext(FetchContext);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Upload form states
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // Song list & search
  const [songs, setSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingSongs, setLoadingSongs] = useState(false);

  useEffect(() => {
    if (showMenu) setShowMenu(false);
    if (!token || role !== "admin") {
      alert("Admin access only");
      navigate("/");
    }
    fetchAllSongs();
  }, [fetchSong]);

  const fetchAllSongs = async () => {
    try {
      setLoadingSongs(true);
      const { data } = await axios.get(`${__URL__}/api/v1/song`);
      setSongs(data.songs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSongs(false);
    }
  };

  const searchSongs = async (query) => {
    if (!query.trim()) {
      fetchAllSongs();
      return;
    }
    try {
      setLoadingSongs(true);
      const { data } = await axios.get(`${__URL__}/api/v1/song/search?q=${encodeURIComponent(query)}`);
      setSongs(data.songs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSongs(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    searchSongs(searchQuery);
  };

  const handleReset = () => {
    setSearchQuery("");
    fetchAllSongs();
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("audio", file);
      formData.append("title", title);
      formData.append("artist", artist);
      formData.append("album", album);
      formData.append("description", description);
      formData.append("genre", genre);

      await axios.post(`${__URL__}/api/v1/song/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-auth-token": token,
        },
      });

      alert("Song uploaded successfully");
      // Reset form
      setTitle("");
      setArtist("");
      setAlbum("");
      setDescription("");
      setGenre("");
      setFile(null);
      setFetchSong((prev) => !prev); // trigger refresh
    } catch (err) {
      alert(err.response?.data?.error || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white p-5">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Upload Form */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Upload New Song</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 rounded text-black" required />
            <input type="text" placeholder="Artist" value={artist} onChange={(e) => setArtist(e.target.value)} className="w-full p-2 rounded text-black" required />
            <input type="text" placeholder="Album" value={album} onChange={(e) => setAlbum(e.target.value)} className="w-full p-2 rounded text-black" required />
            <input type="text" placeholder="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full p-2 rounded text-black" required />
            <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 rounded text-black" required />
            <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files[0])} required />
            <button type="submit" disabled={loading} className="bg-yellow-400 text-black py-2 rounded w-full">
              {loading ? "Uploading..." : "Upload Song"}
            </button>
          </form>
        </div>

        {/* Search Bar */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search songs by title, artist, genre..."
              className="flex-1 p-2 rounded text-black"
            />
            <button type="submit" className="bg-blue-600 px-4 py-2 rounded">Search</button>
            <button type="button" onClick={handleReset} className="bg-gray-600 px-4 py-2 rounded">Reset</button>
          </form>
        </div>

        {/* Admin Song Cards (with update & delete) */}
        <div>
          <h2 className="text-xl font-bold mb-4">Manage Songs</h2>
          {loadingSongs ? (
            <p className="text-center">Loading songs...</p>
          ) : songs.length === 0 ? (
            <p className="text-center text-gray-400">No songs found</p>
          ) : (
            <div className="space-y-2">
              {songs.map((song) => (
                <AdminSongCard key={song._id} song={song} onUpdate={fetchAllSongs} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadSong;