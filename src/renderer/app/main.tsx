import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "../styles/base.css";

// Default theme attributes before settings load, so first paint is themed.
const root = document.documentElement;
if (!root.getAttribute("data-theme")) {
  root.setAttribute("data-theme", "dark");
  root.setAttribute("data-text-scale", "m");
  root.setAttribute("data-reduced-motion", "false");
  root.setAttribute("data-colorblind-safe", "false");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
