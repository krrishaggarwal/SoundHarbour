import React, { useContext, useEffect } from "react";
import { SidebarContext } from "../Context/SibebarContext";
import bg from "../assets/bg4.jpg";
import { Link } from "react-router-dom";

const Home = () => {
  const { showMenu, setShowMenu } = useContext(SidebarContext);

  useEffect(() => {
    if (showMenu) setShowMenu(false);
  }, [showMenu]);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role"); // 👈 important

  return (
    <div
      className="w-full min-h-screen flex justify-center items-center flex-col"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="flex flex-col justify-center items-center space-y-6 bg-black/60 w-full h-screen">

        {/* Title */}
        <h1 className="text-4xl lg:text-6xl text-white font-bold">
          Music Stream
        </h1>

        {/* Subtitle */}
        <p className="text-white text-xl lg:text-3xl">
          Listen to your favorite songs
        </p>

        {/* Buttons */}
        <div className="flex flex-col lg:flex-row gap-4">

          {/* ADMIN ONLY */}
          {token && role === "admin" ? (
            <Link
              to="/upload"
              className="bg-lime-300 px-6 py-2 rounded text-purple-900"
            >
              Upload
            </Link>
          ) : token ? (
            <Link
              to="/explore"
              className="bg-lime-300 px-6 py-2 rounded text-purple-900"
            >
              Start Listening
            </Link>
          ) : (
            <Link
              to="/login"
              className="bg-lime-300 px-6 py-2 rounded text-purple-900"
            >
              Login
            </Link>
          )}

          {/* Stream button */}
          <Link
            to="/explore"
            className="bg-lime-300 px-6 py-2 rounded text-purple-900"
          >
            Stream
          </Link>

        </div>
      </div>
    </div>
  );
};

export default Home;