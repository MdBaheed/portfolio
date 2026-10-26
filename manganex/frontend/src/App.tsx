import { Routes, Route } from "react-router-dom";
import Shell from "./components/Shell";
import Exploration from "./pages/Exploration";
import ProductionForecast from "./pages/ProductionForecast";
import SupplyRisk from "./pages/SupplyRisk";
import Analytics from "./pages/Analytics";
import About from "./pages/About";

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Exploration />} />
        <Route path="/production" element={<ProductionForecast />} />
        <Route path="/supply-risk" element={<SupplyRisk />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Shell>
  );
}
