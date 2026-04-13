import React, { useEffect, useState, useContext } from "react";
import axios from "axios";

import SongCard from "../components/SongCard";
import { SidebarContext } from "../Context/SibebarContext";
import { FetchContext } from "../Context/FetchContext";
import { SongContext } from "../Context/SongContext";

const Songs = () => {
  const { showMenu, setShowMenu } = useContext(SidebarContext);
  const { fetchSong } = useContext(FetchContext);
  const { __URL__ } = useContext(SongContext);

  const [loading, setLoading] = useState(false);
  const [songs, setSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // 📥 Fetch all songs
  const fetchSongs = async () => {
    try {
      setLoading(true);
      setIsSearching(false);

      const { data } = await axios.get(`${__URL__}/api/v1/song`);

      setSongs(data.songs || []);
    } catch (err) {
      console.error(err);
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Search songs
  const searchSongs = async (query) => {
    if (!query.trim()) {
      fetchSongs();
      return;
    }

    try {
      setLoading(true);
      setIsSearching(true);

      const { data } = await axios.get(
        `${__URL__}/api/v1/song/search?q=${encodeURIComponent(query)}`
      );

      setSongs(data.songs || []);
    } catch (err) {
      console.error(err);
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    searchSongs(searchQuery);
  };

  // Reset search and show all songs
  const handleReset = () => {
    setSearchQuery("");
    fetchSongs();
  };

  // Handle input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Optional: auto-search when input is cleared
    if (!value.trim()) {
      fetchSongs();
    }
  };

  useEffect(() => {
    if (showMenu) setShowMenu(false);
    fetchSongs();
  }, [fetchSong]);

  return (
    <div
      onClick={() => setShowMenu(false)}
      className="bg-gray-900 p-5 space-y-4 min-h-screen"
    >
      {/* Search Bar Section */}
      <div className="sticky top-0 z-10 bg-gray-900 pt-2 pb-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by song title, artist, or genre..."
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleReset}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
          {isSearching && (
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Reset
            </button>
          )}
        </form>

        {/* Search info */}
        {isSearching && !loading && (
          <p className="text-gray-400 text-sm mt-2">
            Found {songs.length} result{songs.length !== 1 ? "s" : ""} for "{searchQuery}"
          </p>
        )}
      </div>

      {/* Songs List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : songs.length > 0 ? (
        <div className="space-y-2">
          {songs.map((song) => (
            <SongCard
              key={song._id}
              title={song.title}
              artistName={song.artist}
              fileId={song.fileId}
              userId={song.uploadedBy}
              songId={song._id}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">
            {isSearching
              ? `No songs found matching "${searchQuery}"`
              : "No songs found"}
          </p>
          {isSearching && (
            <button
              onClick={handleReset}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse All Songs
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Songs;