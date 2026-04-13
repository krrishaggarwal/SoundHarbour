import { createContext, useState } from "react";

export const SidebarContext = createContext();

export const SidebarContextState = ({ children }) => {
  const [showMenu, setShowMenu] = useState(false);

  // 🔁 helpers
  const toggleMenu = () => setShowMenu((prev) => !prev);
  const closeMenu = () => setShowMenu(false);

  return (
    <SidebarContext.Provider
      value={{
        showMenu,
        setShowMenu,
        toggleMenu,
        closeMenu,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};