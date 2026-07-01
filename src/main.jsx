import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import "./index.css";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App mode="home" />} />
        <Route path="/check-in" element={<App mode="checkin" />} />
        <Route path="/check-out" element={<App mode="checkout" />} />
        <Route path="/admin" element={<App mode="admin" />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);