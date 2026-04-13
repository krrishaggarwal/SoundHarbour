import { createContext, useState, useRef } from "react";

export const SongContext = createContext();

export const SongContextState = ({ children }) => {
  // 🌐 Backend URL
  const __URL__ =
    document.domain === "localhost"
      ? "http://localhost:1337"
      : "https://music-player-app-backend-yq0c.onrender.com";

  // 🎧 Single audio instance (IMPORTANT)
  const audioRef = useRef(new Audio());
  const audio = audioRef.current;

  // 🎵 Song state (REACTIVE)
  const [songName, setSongName] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [songUrl, setSongUrl] = useState("");
  const [songAlbum, setSongAlbum] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <SongContext.Provider
      value={{
        audio,
        __URL__,

        // state
        songName,
        songArtist,
        songUrl,
        songAlbum,
        isPlaying,

        // setters
        setSongName,
        setSongArtist,
        setSongUrl,
        setSongAlbum,
        setIsPlaying,
      }}
    >
      {children}
    </SongContext.Provider>
  );
};