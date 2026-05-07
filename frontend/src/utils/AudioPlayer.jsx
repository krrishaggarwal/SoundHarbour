import React, { useState, useEffect, useRef, useContext } from "react";
import { useLocation } from "react-router-dom";
import { SongContext } from "../Context/SongContext";
import { QueueContext } from "../Context/QueueContex";
import stereo from "../assets/stereo.jpg";

import { FiSkipBack, FiSkipForward, FiPlay, FiPause, FiVolume2, FiVolumeX } from "react-icons/fi";
import { MdOutlineQueueMusic } from "react-icons/md";

// Pages where the player should be hidden
const HIDDEN_ON = ["/chat", "/upload"];

const fmtTime = (s) => {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec < 10 ? "0" + sec : sec}`;
};

const AudioPlayer = () => {
  const location = useLocation();
  const {
    audio, __URL__,
    songName, songArtist, songUrl,
    isPlaying, setIsPlaying,
    setSongName, setSongArtist, setSongUrl,
  } = useContext(SongContext);
  const { queue, dispatchQueue } = useContext(QueueContext);

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  // ── Seeking state — prevents timeupdate from fighting the drag ──────────
  const isSeeking = useRef(false);
  const seekValue = useRef(0);

  // ── Wire up audio events ─────────────────────────────────────────────────
  useEffect(() => {
    if (!audio) return;

    const onLoaded = () => setDuration(audio.duration || 0);
    const onTimeUpdate = () => {
      if (!isSeeking.current) setCurrentTime(audio.currentTime || 0);
    };
    const onEnded = () => {
      setIsPlaying(false);
      if (queue.length > 0) playNextFromQueue();
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.volume = volume;

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [audio, queue]);

  const playNextFromQueue = () => {
    if (queue.length === 0) return;
    const next = queue[0];
    audio.src = `${__URL__}/api/v1/song/stream/id/${next.fileId}`;
    audio.load();
    audio.play();
    setSongName(next.title);
    setSongArtist(next.artistName || next.artist || "");
    setSongUrl(next.fileId);
    setIsPlaying(true);
    dispatchQueue({ type: "REMOVE_FROM_QUEUE", payload: next.fileId });

    // ✅ Track the play
    const token = localStorage.getItem("token");
    if (token) {
      axios.post(`${__URL__}/api/v1/user/play`,
        { title: next.title, artist: next.artistName || next.artist || "", fileId: next.fileId },
        { headers: { "x-auth-token": token } }
      ).catch(console.error);
    }
  };

  const togglePlay = () => {
    if (!songUrl) return;
    if (audio.paused) { audio.play(); setIsPlaying(true); }
    else { audio.pause(); setIsPlaying(false); }
  };

  const playPrev = () => { if (audio) audio.currentTime = 0; };
  const playNext = () => playNextFromQueue();

  // ── Seek handlers — key fix: commit only on mouse/touch up ──────────────
  const onSeekStart = () => {
    isSeeking.current = true;
  };
  const onSeekMove = (e) => {
    const val = Number(e.target.value);
    seekValue.current = val;
    setCurrentTime(val); // update UI while dragging without moving audio
    // update CSS fill var
    if (duration > 0) {
      e.target.style.setProperty("--seek-pct", `${(val / duration) * 100}%`);
    }
  };
  const onSeekEnd = (e) => {
    const val = Number(e.target.value);
    if (audio && duration > 0) {
      audio.currentTime = val;
    }
    isSeeking.current = false;
  };

  // ── Volume ───────────────────────────────────────────────────────────────
  const onVolume = (e) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (audio) audio.volume = v;
    setMuted(v === 0);
  };
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (audio) audio.volume = next ? 0 : volume;
  };

  // ── Hide on certain pages ────────────────────────────────────────────────
  const hidden = HIDDEN_ON.some((p) => location.pathname.startsWith(p));
  if (hidden) return null;

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Queue panel */}
      {showQueue && (
        <div
          className="fixed bottom-[72px] right-4 w-72 rounded-2xl shadow-lg z-50 overflow-hidden"
          style={{ background: "var(--bg-raised)", border: "1px solid var(--border-md)" }}
        >
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <span className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>Up Next ({queue.length})</span>
            <button onClick={() => setShowQueue(false)} style={{ color: "var(--text-3)" }}>✕</button>
          </div>
          <div className="overflow-y-auto max-h-56 p-2 space-y-1">
            {queue.length === 0 ? (
              <p className="text-center py-6 text-sm" style={{ color: "var(--text-3)" }}>Queue is empty</p>
            ) : queue.map((s, i) => (
              <div key={s.fileId} className="flex items-center gap-3 px-2 py-2 rounded-xl"
                style={{ background: "var(--bg-hover)" }}>
                <span className="text-xs w-4 text-center font-mono" style={{ color: "var(--text-3)" }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate font-medium" style={{ color: "var(--text-1)" }}>{s.title}</p>
                  <p className="text-xs truncate" style={{ color: "var(--text-2)" }}>{s.artistName || s.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Player bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-4 py-0"
        style={{ background: "var(--bg-surface)", borderTop: "1px solid var(--border)", boxShadow: "0 -4px 20px rgba(0,0,0,0.5)" }}
      >
        {/* Progress bar — full width, above controls */}
        <div className="relative -mx-4">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onMouseDown={onSeekStart}
            onTouchStart={onSeekStart}
            onChange={onSeekMove}
            onMouseUp={onSeekEnd}
            onTouchEnd={onSeekEnd}
            className="seek-slider w-full block"
            style={{ "--seek-pct": `${pct}%`, borderRadius: 0, height: "3px" }}
          />
        </div>

        <div className="flex items-center h-[60px] gap-4">
          {/* Song info */}
          <div className="flex items-center gap-3 w-[30%] min-w-0">
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
              style={{ background: "var(--bg-hover)" }}>
              <img src={stereo} alt="" className="w-full h-full object-cover opacity-70" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>
                {songName || "—"}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--text-2)" }}>
                {songArtist || "No song playing"}
              </p>
            </div>
          </div>

          {/* Controls — center */}
          <div className="flex-1 flex items-center justify-center gap-4">
            <button onClick={playPrev} style={{ color: "var(--text-2)" }}
              className="hover:text-white transition-colors p-1">
              <FiSkipBack size={18} />
            </button>
            <button
              onClick={togglePlay}
              disabled={!songUrl}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 disabled:opacity-30"
              style={{ background: "var(--accent)", color: "#0a0a0f" }}
            >
              {isPlaying ? <FiPause size={18} /> : <FiPlay size={18} className="ml-0.5" />}
            </button>
            <button onClick={playNext} style={{ color: "var(--text-2)" }}
              className="hover:text-white transition-colors p-1">
              <FiSkipForward size={18} />
            </button>
          </div>

          {/* Right — time + volume + queue */}
          <div className="w-[30%] flex items-center justify-end gap-3">
            <span className="text-xs tabular-nums hidden sm:block" style={{ color: "var(--text-3)" }}>
              {fmtTime(currentTime)} / {fmtTime(duration)}
            </span>

            <button onClick={toggleMute} style={{ color: "var(--text-2)" }}
              className="hover:text-white transition-colors hidden sm:block">
              {muted || volume === 0 ? <FiVolumeX size={16} /> : <FiVolume2 size={16} />}
            </button>
            <input
              type="range" min={0} max={1} step={0.02} value={muted ? 0 : volume}
              onChange={onVolume}
              className="vol-slider hidden sm:block"
            />

            <button onClick={() => setShowQueue((v) => !v)}
              className="relative p-1 hover:text-white transition-colors"
              style={{ color: showQueue ? "var(--accent)" : "var(--text-2)" }}>
              <MdOutlineQueueMusic size={18} />
              {queue.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center"
                  style={{ background: "var(--accent)", color: "#0a0a0f" }}>
                  {queue.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AudioPlayer;