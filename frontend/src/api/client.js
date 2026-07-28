import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export const getRTM = () => api.get("/api/rtm").then((r) => r.data);
export const getRTMForRequirement = (id) => api.get(`/api/rtm/${id}`).then((r) => r.data);
export const regenerateRTM = () => api.post("/api/rtm/regenerate").then((r) => r.data);
export const getGaps = () => api.get("/api/rtm/gaps").then((r) => r.data);
export const getPortfolio = () => api.get("/api/portfolio/analysis").then((r) => r.data);

export const getDashboardSummary = () => api.get("/api/dashboard/summary").then((r) => r.data);

export const getProjectSettings = () => api.get("/api/project-settings").then((r) => r.data);
export const updateProjectSettings = (payload) =>
  api.put("/api/project-settings", payload).then((r) => r.data);

export const getRequirements = () => api.get("/api/requirements").then((r) => r.data);
export const createRequirement = (payload) =>
  api.post("/api/requirements", payload).then((r) => r.data);

export const createAcceptanceCriteria = (requirementId, payload) =>
  api.post(`/api/requirements/${requirementId}/acceptance-criteria`, payload).then((r) => r.data);

export const getTests = () => api.get("/api/tests").then((r) => r.data);
export const createTestCase = (payload) => api.post("/api/tests", payload).then((r) => r.data);
export const predictQuality = (testId) =>
  api.post(`/api/tests/${testId}/predict-quality`).then((r) => r.data);
export const addCoverage = (testId, payload) =>
  api.post(`/api/tests/${testId}/coverage`, payload).then((r) => r.data);

export const analyzeGithubCoverage = (repoUrl) =>
  api.post("/api/coverage/analyze", { repo_url: repoUrl }).then((r) => r.data);
export const getGithubCoverageStatus = () => api.get("/api/coverage/status").then((r) => r.data);
export const getGithubCoverageReport = () => api.get("/api/coverage/report").then((r) => r.data);
export const getGithubConnectionStatus = () => api.get("/api/github/status").then((r) => r.data);
