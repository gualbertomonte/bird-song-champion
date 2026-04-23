import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Lazy-load Google AdSense after the page is interactive to avoid blocking LCP
if (typeof window !== "undefined" && !document.querySelector('script[data-adsense-loader]')) {
  const loadAds = () => {
    const s = document.createElement("script");
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2835871674648959";
    s.setAttribute("data-adsense-loader", "true");
    document.head.appendChild(s);
  };
  if (document.readyState === "complete") {
    setTimeout(loadAds, 1500);
  } else {
    window.addEventListener("load", () => setTimeout(loadAds, 1500), { once: true });
  }
}
