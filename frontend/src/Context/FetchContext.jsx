import { createContext, useState } from "react";
export const FetchContext = createContext();

export const FetchContextState = ({ children }) => {
    const __URL__ = "http://localhost:1337";
    const [fetchSong, setFetchSong] = useState(false);
    const [fetchPlaylist, setFetchPlaylist] = useState(false);

    const refreshSongs = () => setFetchSong((prev) => !prev);
    const refreshPlaylists = () => setFetchPlaylist((prev) => !prev);

    return (
        <FetchContext.Provider
            value={{
                __URL__,
                fetchSong,
                setFetchSong,
                fetchPlaylist,
                setFetchPlaylist,
                refreshSongs,
                refreshPlaylists,
            }}
        >
            {children}
        </FetchContext.Provider>
    );
};