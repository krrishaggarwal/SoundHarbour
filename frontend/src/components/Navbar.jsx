import React, { useContext, useEffect, useState, useCallback } from "react";
import { SidebarContext } from "../Context/SibebarContext";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { SongContext } from "../Context/SongContext";

import { GoHome } from "react-icons/go";
import { GiMusicSpell } from "react-icons/gi";
import { TfiWrite } from "react-icons/tfi";
import { CgPlayList } from "react-icons/cg";
import { FiMenu, FiUser, FiMessageCircle, FiUsers, FiX } from "react-icons/fi";

const NavAv = ({ name }) => {
  const initials = name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
      style={{ background: "linear-gradient(135deg, var(--accent), #ea580c)" }}>
      {initials}
    </div>
  );
};

const navLink = (isActive) => ({
  display: "flex", alignItems: "center", gap: "7px", fontSize: "14px", fontWeight: 500,
  color: isActive ? "var(--accent)" : "var(--text-2)",
  transition: "color 0.15s",
  padding: "4px 2px",
  textDecoration: "none",
  borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
});

const Navbar = () => {
  const { showMenu, setShowMenu } = useContext(SidebarContext);
  const { __URL__ } = useContext(SongContext);
  const navigate = useNavigate();

  const token    = localStorage.getItem("token");
  const role     = localStorage.getItem("role");
  const fullName = localStorage.getItem("fullName");

  const [pendingReqs,  setPendingReqs]  = useState(0);
  const [unreadMsgs,   setUnreadMsgs]   = useState(0);

  const loadBadges = useCallback(async () => {
    if (!token) return;
    try {
      const headers = { "x-auth-token": token };
      const [reqRes, convRes] = await Promise.all([
        axios.get(`${__URL__}/api/v1/follow/requests`,    { headers }),
        axios.get(`${__URL__}/api/v1/chat/conversations`, { headers }),
      ]);
      setPendingReqs(reqRes.data.requests?.length || 0);
      setUnreadMsgs((convRes.data.conversations || []).reduce((s, c) => s + (c.unreadCount || 0), 0));
    } catch {}
  }, [token, __URL__]);

  useEffect(() => {
    loadBadges();
    const t = setInterval(loadBadges, 30000);
    return () => clearInterval(t);
  }, [loadBadges]);

  const logOut = () => {
    ["token","role","fullName"].forEach((k) => localStorage.removeItem(k));
    navigate("/");
  };

  const Badge = ({ count }) => count > 0 ? (
    <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center"
      style={{ background: "#ef4444", color: "#fff" }}>
      {count > 9 ? "9+" : count}
    </span>
  ) : null;

  const NavIcon = ({ Icon, count }) => (
    <div className="relative"><Icon size={17} /><Badge count={count} /></div>
  );

  return (
    <header className="z-50 w-full sticky top-0" style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
      <nav className="max-w-screen-xl mx-auto w-full flex justify-between items-center px-5 h-14">

        <NavLink to="/" className="text-lg font-black tracking-tight" style={{ color: "var(--text-1)" }}>
          SoundHarbour
        </NavLink>

        <button onClick={() => setShowMenu(!showMenu)} className="lg:hidden p-1"
          style={{ color: "var(--text-2)" }}>
          <FiMenu size={22} />
        </button>

        {showMenu && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowMenu(false)} />
            <div className="relative ml-auto w-64 h-full flex flex-col py-6 px-5 space-y-5"
              style={{ background: "var(--bg-raised)" }}>
              <button onClick={() => setShowMenu(false)} className="self-end mb-2"
                style={{ color: "var(--text-3)" }}>
                <FiX size={20} />
              </button>
              {[
                ["/", <GoHome size={17} />, "Home"],
                ["/explore", <GiMusicSpell size={17} />, "Songs"],
                ...(role === "admin" ? [["/upload", <TfiWrite size={17} />, "Upload"]] : []),
                ["/playlists", <CgPlayList size={17} />, "Playlists"],
                ...(token ? [
                  ["/people",  <NavIcon Icon={FiUsers}         count={pendingReqs} />, "People"],
                  ["/chat",    <NavIcon Icon={FiMessageCircle} count={unreadMsgs}  />, "Chat"],
                  ["/profile", <FiUser size={17} />, "Profile"],
                ] : []),
              ].map(([to, icon, label]) => (
                <NavLink key={to} to={to} onClick={() => setShowMenu(false)}
                  style={({ isActive }) => navLink(isActive)}>
                  {icon} {label}
                </NavLink>
              ))}
              <div className="pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                {token
                  ? <button onClick={logOut} className="w-full py-2 rounded-xl font-semibold text-sm"
                    style={{ background: "var(--accent)", color: "#0a0a0f" }}>Log Out</button>
                  : <div className="flex gap-3">
                    <NavLink to="/login"    className="flex-1 text-center py-2 rounded-xl text-sm font-semibold"
                      style={{ background: "var(--bg-hover)", color: "var(--text-1)" }}>Log In</NavLink>
                    <NavLink to="/register" className="flex-1 text-center py-2 rounded-xl text-sm font-semibold"
                      style={{ background: "var(--accent)", color: "#0a0a0f" }}>Sign Up</NavLink>
                  </div>
                }
              </div>
            </div>
          </div>
        )}

        <div className="hidden lg:flex items-center gap-5">
          {[
            ["/", <GoHome size={16} />, "Home"],
            ["/explore", <GiMusicSpell size={16} />, "Songs"],
            ...(role === "admin" ? [["/upload", <TfiWrite size={16} />, "Upload"]] : []),
            ["/playlists", <CgPlayList size={16} />, "Playlists"],
          ].map(([to, icon, label]) => (
            <NavLink key={to} to={to} style={({ isActive }) => navLink(isActive)}>
              {icon} <span>{label}</span>
            </NavLink>
          ))}

          {token ? (
            <div className="flex items-center gap-3 pl-3" style={{ borderLeft: "1px solid var(--border)" }}>
              <NavLink to="/people" style={({ isActive }) => navLink(isActive)}>
                <NavIcon Icon={FiUsers} count={pendingReqs} />
                <span>People</span>
              </NavLink>
              <NavLink to="/chat" style={({ isActive }) => navLink(isActive)}>
                <NavIcon Icon={FiMessageCircle} count={unreadMsgs} />
                <span>Chat</span>
              </NavLink>
              <NavLink to="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors"
                style={({ isActive }) => ({
                  background: isActive ? "rgba(245,158,11,0.12)" : "var(--bg-raised)",
                  border: "1px solid var(--border)",
                  color: isActive ? "var(--accent)" : "var(--text-1)",
                })}>
                {fullName ? <NavAv name={fullName} /> : <FiUser size={15} />}
                <span className="text-sm font-medium">Profile</span>
              </NavLink>
              <button onClick={logOut}
                className="px-4 py-1.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: "var(--accent)", color: "#0a0a0f" }}>
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 pl-3" style={{ borderLeft: "1px solid var(--border)" }}>
              <NavLink to="/login"    className="text-sm font-medium transition-colors hover:opacity-70" style={{ color: "var(--text-2)" }}>Log In</NavLink>
              <NavLink to="/register" className="px-4 py-1.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: "var(--accent)", color: "#0a0a0f" }}>Sign Up</NavLink>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;