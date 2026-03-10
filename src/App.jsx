import { useState, useEffect } from "react";
import Home from "./pages/Home";

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Small delay for font loading
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      height: "100vh",
      opacity: ready ? 1 : 0,
      transition: "opacity 0.3s ease",
    }}>
      <Home />
    </div>
  );
}
