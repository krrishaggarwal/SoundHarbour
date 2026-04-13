import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  // 🔥 Remove StrictMode if facing double API calls in dev
  <React.StrictMode>
    <App />
  </React.StrictMode>
);