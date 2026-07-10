import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Transparency from "./pages/Transparency";
import { BlockDetail } from "./components/BlockDetail";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/transparency" element={<Transparency />} />
        <Route path="/transparency/block/:height" element={<BlockDetail />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
