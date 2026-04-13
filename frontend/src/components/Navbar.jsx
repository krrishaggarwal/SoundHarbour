import React, { useContext, useEffect, useState } from "react";
import { SidebarContext } from "../Context/SibebarContext";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { SongContext } from "../Context/SongContext";

import { GoHome } from "react-icons/go";
import { GiMusicSpell } from "react-icons/gi";
import { TfiWrite } from "react-icons/tfi";
import { CgPlayList } from "react-icons/cg";
import { BiWindowClose } from "react-icons/bi";
import { FiMenu, FiUser, FiMessageCircle, FiUsers, FiBell } from "react-icons/fi";

const NavAvatar = ({ name }) => {
  const initials = name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white">
      {initials}
    </div>
  );
};

const Navbar = () => {
  const { showMenu, setShowMenu } = useContext(SidebarContext);
  const { __URL__ } = useContext(SongContext);
  const navigate = useNavigate();

  const token    = localStorage.getItem("token");
  const role     = localStorage.getItem("role");
  const fullName = localStorage.getItem("fullName");

  const [pendingRequests, setPendingRequests] = useState(0);
  const [unreadMessages,  setUnreadMessages]  = useState(0);

  useEffect(() => {
    if (!token) return;
    const headers = { "x-auth-token": token };
    const load = async () => {
      try {
        const [reqRes, convRes] = await Promise.all([
          axios.get(`${__URL__}/api/v1/follow/requests`,     { headers }),
          axios.get(`${__URL__}/api/v1/chat/conversations`,  { headers }),
        ]);
        setPendingRequests(reqRes.data.requests?.length || 0);
        setUnreadMessages((convRes.data.conversations || []).reduce((s, c) => s + (c.unreadCount || 0), 0));
      } catch {}
    };
    load();
    const interval = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [token, __URL__]);

  const logOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("fullName");
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    isActive ? "flex items-center space-x-2 text-yellow-400" : "flex items-center space-x-2 text-white";

  const BadgeIcon = ({ icon: Icon, count, size = 18 }) => (
    <div className="relative">
      <Icon size={size} />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </div>
  );

  return (
    <header className="z-50 w-full sticky top-0 bg-gray-900 text-white shadow-lg">
      <nav className="w-full flex justify-between items-center px-6 py-3">
        <NavLink to="/" className="text-xl font-bold">SoundHarbour</NavLink>
        <button onClick={() => setShowMenu(!showMenu)} className="lg:hidden"><FiMenu size={25} /></button>

        {/* Mobile sidebar */}
        <div className={`lg:hidden fixed top-0 right-0 w-64 h-full bg-gray-900 p-6 space-y-6 transition-transform duration-300 z-50
          ${showMenu ? "translate-x-0" : "translate-x-full"}`}>
          <NavLink to="/" className={linkClass}><GoHome /><span>Home</span></NavLink>
          <NavLink to="/explore" className={linkClass}><GiMusicSpell /><span>Songs</span></NavLink>
          {role === "admin" && <NavLink to="/upload" className={linkClass}><TfiWrite /><span>Upload</span></NavLink>}
          <NavLink to="/playlists" className={linkClass}><CgPlayList /><span>Playlists</span></NavLink>
          {token && (
            <>
              <NavLink to="/people" className={linkClass}>
                <div className="relative"><FiUsers size={18} />
                  {pendingRequests > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full text-[8px] font-bold flex items-center justify-center">{pendingRequests}</span>}
                </div>
                <span>People</span>
              </NavLink>
              <NavLink to="/chat" className={linkClass}>
                <div className="relative"><FiMessageCircle size={18} />
                  {unreadMessages > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full text-[8px] font-bold flex items-center justify-center">{unreadMessages}</span>}
                </div>
                <span>Chat</span>
              </NavLink>
              <NavLink to="/profile" className={linkClass}><FiUser /><span>Profile</span></NavLink>
            </>
          )}
          {token
            ? <button onClick={logOut} className="bg-yellow-400 text-black px-4 py-1 rounded">Log Out</button>
            : <><NavLink to="/login" className="text-yellow-400">Log In</NavLink><NavLink to="/register" className="text-yellow-400">Sign Up</NavLink></>
          }
          <button onClick={() => setShowMenu(false)} className="flex items-center space-x-2"><BiWindowClose /><span>Close</span></button>
        </div>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center space-x-6">
          <NavLink to="/" className={linkClass}><GoHome /><span>Home</span></NavLink>
          <NavLink to="/explore" className={linkClass}><GiMusicSpell /><span>Songs</span></NavLink>
          {role === "admin" && <NavLink to="/upload" className={linkClass}><TfiWrite /><span>Upload</span></NavLink>}
          <NavLink to="/playlists" className={linkClass}><CgPlayList /><span>Playlists</span></NavLink>

          {token ? (
            <div className="flex items-center gap-4">
              <NavLink to="/people" className={({ isActive }) =>
                `flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors ${isActive ? "text-yellow-400" : "text-white hover:text-yellow-400"}`}>
                <BadgeIcon icon={FiUsers} count={pendingRequests} />
                <span className="text-sm">People</span>
              </NavLink>

              <NavLink to="/chat" className={({ isActive }) =>
                `flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors ${isActive ? "text-yellow-400" : "text-white hover:text-yellow-400"}`}>
                <BadgeIcon icon={FiMessageCircle} count={unreadMessages} />
                <span className="text-sm">Chat</span>
              </NavLink>

              <NavLink to="/profile" className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${isActive ? "bg-amber-400/20 text-amber-400" : "hover:bg-gray-800 text-white"}`}>
                {fullName ? <NavAvatar name={fullName} /> : <FiUser size={18} />}
                <span className="text-sm">Profile</span>
              </NavLink>

              <button onClick={logOut} className="bg-yellow-400 text-black px-4 py-1 rounded hover:opacity-80">
                Log Out
              </button>
            </div>
          ) : (
            <>
              <NavLink to="/login" className="text-yellow-400">Log In</NavLink>
              <NavLink to="/register" className="text-yellow-400">Sign Up</NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;