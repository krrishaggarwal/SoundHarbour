import React, { useState, useEffect, useRef, useContext } from "react";
import stereo from "../assets/stereo.jpg";
import { SongContext } from "../Context/SongContext";
import { QueueContext } from "../Context/QueueContex";

import { CiPlay1, CiPause1 } from "react-icons/ci";
import { FiSkipBack, FiSkipForward } from "react-icons/fi";

const AudioPlayer = () => {
  const {
    audio,
    __URL__,
    songName,
    songArtist,
    songUrl,
    isPlaying,
    setSongName,
    setSongArtist,
    setSongUrl,
    setIsPlaying,
  } = useContext(SongContext);

  const { queue, dispatchQueue } = useContext(QueueContext);

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const progressBar = useRef();

  // 🎧 Sync audio events
  useEffect(() => {
    if (!audio) return;

    const handleLoaded = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [audio]);

  // ▶️ Play / Pause
  const togglePlayPause = () => {
    if (!songUrl) return;

    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  // ⏭️ Next song (queue)
  const playNext = () => {
    if (queue.length === 0) return;

    const next = queue[0];

    audio.src = `${__URL__}/api/v1/song/stream/${next.fileId}`;
    audio.load();
    audio.play();

    setSongName(next.title);
    setSongArtist(next.artistName);
    setSongUrl(next.fileId);
    setIsPlaying(true);

    dispatchQueue({
      type: "REMOVE_FROM_QUEUE",
      payload: next.songSrc,
    });
  };

  // ⏮️ Previous (basic restart)
  const playPrev = () => {
    audio.currentTime = 0;
  };

  // 🎚️ Seek
  const handleSeek = (e) => {
    const time = e.target.value;
    audio.currentTime = time;
    setCurrentTime(time);
  };

  // ⏱️ Format time
  const formatTime = (secs) => {
    if (!secs) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white px-4 py-2 flex justify-between items-center">

      {/* 🎵 Song Info */}
      <div className="flex items-center space-x-3">
        <img src={stereo} alt="song" className="w-12 rounded" />
        <div>
          <h3>{songName || "No song"}</h3>
          <p className="text-sm text-gray-400">{songArtist}</p>
        </div>
      </div>

      {/* 🎮 Controls */}
      <div className="flex items-center space-x-4">
        <button onClick={playPrev}>
          <FiSkipBack />
        </button>

        <button onClick={togglePlayPause}>
          {isPlaying ? <CiPause1 /> : <CiPlay1 />}
        </button>

        <button onClick={playNext}>
          <FiSkipForward />
        </button>
      </div>

      {/* 🎚️ Progress */}
      <div className="hidden lg:flex items-center space-x-3 w-[300px]">
        <span>{formatTime(currentTime)}</span>

        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          onChange={handleSeek}
          className="w-full"
        />

        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default AudioPlayer;