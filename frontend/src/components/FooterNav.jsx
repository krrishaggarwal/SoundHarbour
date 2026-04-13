import React from "react";
import { AiOutlineHome } from "react-icons/ai";
import { MdOutlineExplore, MdLibraryMusic } from "react-icons/md";
import { NavLink } from "react-router-dom";
import Song from "../MusicPlayer";

const FooterNav = () => {
  return (
    <div className="fixed bottom-0 right-0 left-0 flex flex-col shadow-md">

      <Song />
      
      <nav className="flex bg-white w-full h-12 justify-around items-center border-t">

        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "text-blue-500" : "text-gray-600"
          }
        >
          <AiOutlineHome size={25} />
        </NavLink>

        <NavLink
          to="/explore"
          className={({ isActive }) =>
            isActive ? "text-blue-500" : "text-gray-600"
          }
        >
          <MdOutlineExplore size={25} />
        </NavLink>

        <NavLink
          to="/library"
          className={({ isActive }) =>
            isActive ? "text-blue-500" : "text-gray-600"
          }
        >
          <MdLibraryMusic size={25} />
        </NavLink>

      </nav>
    </div>
  );
};

export default FooterNav;