import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider, Outlet, useRouteError, Link, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Songs from "./pages/Songs";
import UploadSong from "./pages/UploadSong";
import Login from "./pages/Login";
import CreatePlayList from "./pages/CreatePlaylist";
import AudioPlayer from "./utils/AudioPlayer";
import Register from "./pages/Register";
import Playlist from "./pages/Playlist";

const Profile       = lazy(() => import("./pages/Profile"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const Chat          = lazy(() => import("./pages/Chat"));
const People        = lazy(() => import("./pages/People"));

import { SidebarContextState } from "./Context/SibebarContext";
import { SongContextState }    from "./Context/SongContext";
import { QueueContextState }   from "./Context/QueueContex";
import { FetchContextState }   from "./Context/FetchContext";
import { SocketContextState }  from "./Context/SocketContext";

const RouteError = () => {
  const error = useRouteError();
  return (
    <div className="min-h-screen flex items-center justify-center px-6 text-white"
      style={{ background: "var(--bg-base)" }}>
      <div className="text-center space-y-4 max-w-sm">
        <p className="text-5xl">🎵</p>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-sm" style={{ color: "var(--text-2)" }}>
          {error?.statusText || error?.message || "Unexpected error"}
        </p>
        <Link to="/" className="inline-block px-6 py-2 rounded-full font-semibold text-sm transition-opacity hover:opacity-80"
          style={{ background: "var(--accent)", color: "#0a0a0f" }}>
          Go Home
        </Link>
      </div>
    </div>
  );
};

const AdminRoute   = ({ children }) => localStorage.getItem("role") !== "admin" ? <Home />  : children;
const PrivateRoute = ({ children }) => !localStorage.getItem("token")           ? <Login /> : children;

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
    <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
      style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
  </div>
);

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

const L = ({ children }) => <Suspense fallback={<Spinner />}>{children}</Suspense>;

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { path: "/",            element: <Home /> },
      { path: "/explore",     element: <Songs /> },
      { path: "/upload",      element: <AdminRoute><UploadSong /></AdminRoute> },
      { path: "/playlists",   element: <PrivateRoute><CreatePlayList /></PrivateRoute> },
      { path: "/playlist/:id",element: <PrivateRoute><Playlist /></PrivateRoute> },
      {
        path: "/profile",
        errorElement: <RouteError />,
        element: <PrivateRoute><L><Profile /></L></PrivateRoute>,
      },
      {
        path: "/user/:userId",
        errorElement: <RouteError />,
        element: <L><PublicProfile /></L>,
      },
      {
        path: "/chat",
        errorElement: <RouteError />,
        element: <PrivateRoute><L><Chat /></L></PrivateRoute>,
      },
      {
        path: "/people",
        errorElement: <RouteError />,
        element: <PrivateRoute><L><People /></L></PrivateRoute>,
      },
    ],
  },
  { path: "/login",    element: <Login />,    errorElement: <RouteError /> },
  { path: "/register", element: <Register />, errorElement: <RouteError /> },
]);

const App = () => <RouterProvider router={router} />;
export default App;