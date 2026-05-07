import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import { SongContext } from "../Context/SongContext";
import { FetchContext } from "../Context/FetchContext";
import { MdDeleteOutline, MdEdit } from "react-icons/md";
import musicbg from "../assets/musicbg.jpg";

const AdminSongCard = ({ song, onUpdate }) => {
  const { __URL__ } = useContext(SongContext);
  const { setFetchSong } = useContext(FetchContext);
  const token = localStorage.getItem("token");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: song.title,
    artist: song.artist,
    album: song.album || "",
    genre: song.genre,
    description: song.description || "",
  });

  const deleteSong = async () => {
    if (!window.confirm("Delete this song permanently?")) return;
    try {
      await axios.delete(`${__URL__}/api/v1/song/delete/${song._id}`, {
        headers: { "x-auth-token": token },
      });
      alert("Song deleted");
      setFetchSong((prev) => !prev);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert("Delete failed");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${__URL__}/api/v1/song/update/${song._id}`,
        editForm,
        { headers: { "x-auth-token": token } }
      );
      alert("Song updated");
      setShowEditModal(false);
      setFetchSong((prev) => !prev);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert("Update failed");
    }
  };

  return (
    <>
      <div className="flex bg-gray-800 text-white justify-between items-center border-b p-2 lg:w-[70vw] mx-auto">
        <div className="flex space-x-4">
          <img src={musicbg} alt="song" className="w-14 h-14 object-cover" />
          <div>
            <div>{song.title}</div>
            <div className="text-gray-400">{song.artist}</div>
            <div className="text-xs text-gray-500">{song.genre}</div>
          </div>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setShowEditModal(true)} className="text-blue-400">
            <MdEdit size={24} />
          </button>
          <button onClick={deleteSong} className="text-red-400">
            <MdDeleteOutline size={24} />
          </button>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4 text-white">Edit Song</h2>
            <form onSubmit={handleUpdate} className="space-y-3">
              <input
                type="text"
                placeholder="Title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full p-2 rounded text-black"
                required
              />
              <input
                type="text"
                placeholder="Artist"
                value={editForm.artist}
                onChange={(e) => setEditForm({ ...editForm, artist: e.target.value })}
                className="w-full p-2 rounded text-black"
                required
              />
              <input
                type="text"
                placeholder="Album"
                value={editForm.album}
                onChange={(e) => setEditForm({ ...editForm, album: e.target.value })}
                className="w-full p-2 rounded text-black"
              />
              <input
                type="text"
                placeholder="Genre"
                value={editForm.genre}
                onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })}
                className="w-full p-2 rounded text-black"
                required
              />
              <textarea
                placeholder="Description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full p-2 rounded text-black"
              />
              <div className="flex gap-2">
                <button type="submit" className="bg-blue-600 px-4 py-2 rounded text-white">Save</button>
                <button type="button" onClick={() => setShowEditModal(false)} className="bg-gray-600 px-4 py-2 rounded text-white">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSongCard;