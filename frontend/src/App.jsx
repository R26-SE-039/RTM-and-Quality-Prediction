import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import CodeCoveragePage from "./pages/CodeCoveragePage";
import DashboardPage from "./pages/DashboardPage";
import GapsPage from "./pages/GapsPage";
import PortfolioPage from "./pages/PortfolioPage";
import QualityPredictionPage from "./pages/QualityPredictionPage";
import RequirementDetailPage from "./pages/RequirementDetailPage";
import RTMMatrixPage from "./pages/RTMMatrixPage";
import TestInventoryPage from "./pages/TestInventoryPage";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/inventory" element={<TestInventoryPage />} />
          <Route path="/quality-prediction" element={<QualityPredictionPage />} />
          <Route path="/rtm" element={<RTMMatrixPage />} />
          <Route path="/gaps" element={<GapsPage />} />
          <Route path="/coverage" element={<CodeCoveragePage />} />
          <Route path="/requirements/:id" element={<RequirementDetailPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
