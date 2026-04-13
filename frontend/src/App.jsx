import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider, Outlet, useRouteError, Link } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Songs from "./pages/Songs";
import UploadSong from "./pages/UploadSong";
import Login from "./pages/Login";
import CreatePlayList from "./pages/CreatePlaylist";
import AudioPlayer from "./utils/AudioPlayer";
import Register from "./pages/Register";
import Playlist from "./pages/Playlist";

const Profile = lazy(() => import("./pages/Profile"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const Chat = lazy(() => import("./pages/Chat"));
const People = lazy(() => import("./pages/People"));

import { SidebarContextState } from "./Context/SibebarContext";
import { SongContextState } from "./Context/SongContext";
import { QueueContextState } from "./Context/QueueContex";
import { FetchContextState } from "./Context/FetchContext";
import { SocketContextState } from "./Context/SocketContext";

const RouteError = () => {
  const error = useRouteError();
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white px-6">
      <div className="text-center space-y-4 max-w-md">
        <p className="text-5xl">🎵</p>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-gray-400 text-sm">{error?.statusText || error?.message || "Unexpected error"}</p>
        <Link to="/" className="inline-block bg-amber-400 text-gray-950 font-semibold px-6 py-2 rounded-full hover:bg-amber-300 transition-colors">
          Go Home
        </Link>
      </div>
    </div>
  );
};

const AdminRoute = ({ children }) => localStorage.getItem("role") !== "admin" ? <Home /> : children;
const PrivateRoute = ({ children }) => !localStorage.getItem("token") ? <Login /> : children;

const Spinner = () => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center">
    <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
  </div>
);

const Lazy = ({ children }) => <Suspense fallback={<Spinner />}>{children}</Suspense>;

const Layout = () => (
  <SidebarContextState>
    <SongContextState>
      <FetchContextState>
        <QueueContextState>
          <SocketContextState>
            <div className="w-screen relative">
              <Navbar />
              <Outlet />
              <AudioPlayer />
            </div>
          </SocketContextState>
        </QueueContextState>
      </FetchContextState>
    </SongContextState>
  </SidebarContextState>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/explore", element: <Songs /> },
      { path: "/upload", element: <AdminRoute><UploadSong /></AdminRoute> },
      { path: "/playlists", element: <PrivateRoute><CreatePlayList /></PrivateRoute> },
      { path: "/playlist/:id", element: <PrivateRoute><Playlist /></PrivateRoute> },

      { path: "/profile", errorElement: <RouteError />, element: <PrivateRoute><Lazy><Profile /></Lazy></PrivateRoute> },
      { path: "/user/:userId", errorElement: <RouteError />, element: <Lazy><PublicProfile /></Lazy> },
      { path: "/chat", errorElement: <RouteError />, element: <PrivateRoute><Lazy><Chat /></Lazy></PrivateRoute> },
      { path: "/people", errorElement: <RouteError />, element: <PrivateRoute><Lazy><People /></Lazy></PrivateRoute> },
    ],
  },
  { path: "/login", element: <Login />, errorElement: <RouteError /> },
  { path: "/register", element: <Register />, errorElement: <RouteError /> },
]);

const App = () => <RouterProvider router={router} />;
export default App;