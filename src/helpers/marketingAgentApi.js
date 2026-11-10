import axios from "axios";
import { api } from "../config";

const agentAxios = axios.create({
  baseURL: `${api.MARKETING_AGENT_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
  withXSRFToken: false,
});

const INHERITED_HEADERS = ["credentials", "X-XSRF-TOKEN", "x-xsrf-token"];

agentAxios.interceptors.request.use((config) => {
  INHERITED_HEADERS.forEach((name) => config.headers.delete(name));
  const raw = localStorage.getItem("micrologin");
  const token = raw ? JSON.parse(raw)?.token : null;
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  } else {
    config.headers.delete("Authorization");
  }
  return config;
});

agentAxios.interceptors.response.use(
  (response) => (response.status === 204 ? null : response.data),
  (error) =>
    Promise.reject({
      status: error.response?.status,
      message:
        error.response?.data?.error?.message ||
        error.message ||
        "Marketing agent is not reachable",
      details: error.response?.data?.error?.details,
    }),
);

const get = (url, params) => agentAxios.get(url, { params });
const post = (url, body, params) =>
  agentAxios.post(url, body ?? {}, { params });
const put = (url, body) => agentAxios.put(url, body);

export const getCities = (params) => get("/cities", params);
export const addCity = (body) => post("/cities", body);
export const updateCity = (slug, body) =>
  agentAxios.patch(`/cities/${slug}`, body);
export const deleteCity = (slug) => agentAxios.delete(`/cities/${slug}`);
export const getJob = (id) => get(`/jobs/${id}`);
export const getActiveJob = (key) => get("/jobs/active", { key });
export const getRewritePreview = (weekId, includeApproved) =>
  get("/content/rewrite-preview", {
    week_id: weekId,
    include_approved: includeApproved,
  });
export const rewriteWeek = (body) => post("/content/rewrite-week", body);
export const setContentButton = (contentId, button) =>
  put(`/content/${contentId}/button`, { button });

export const runListen = () => post("/listen/run");
export const listSignals = (params) => get("/signals", params);
export const searchSignals = (body) => post("/signals/search", body);
export const askSignals = (body) => post("/signals/ask", body);
export const getRagInventory = () => get("/rag/inventory");
export const getWebReport = (params) => get("/listen/web", params);
export const getErpReport = (params) => get("/listen/erp", params);
export const getTrends = (city, limit = 20) =>
  get(`/trends/${city}`, { limit });
export const computeTrends = (city) => post(`/trends/${city}/compute`);
export const getLatestDigest = () => get("/digests/latest");
export const buildDigest = () => post("/digests/run");
export const getAlerts = (params) => get("/alerts", params);
export const acknowledgeAlert = (id) => post(`/alerts/${id}/acknowledge`);

export const getPlans = (params) => get("/plans", params);
export const getPlan = (id) => get(`/plans/${id}`);
export const generatePlan = (body) => post("/plans/generate", body);
export const getPlanInputs = (body) => post("/plans/inputs", body);
export const previewPlanPrompt = (body) => post("/plans/prompt-preview", body);
export const previewWriterPrompt = (body) =>
  post("/content/prompt-preview", body);
export const getPrompts = () => get("/prompts");
export const savePrompt = (key, text) => put(`/prompts/${key}`, { text });
export const resetPrompt = (key) => agentAxios.delete(`/prompts/${key}`);
export const regeneratePlan = (id, body) =>
  post(`/plans/${id}/regenerate`, body);
export const getWriterInputs = (body) => post("/content/inputs", body);
export const approvePlan = (id, reason) =>
  post(`/plans/${id}/approve`, { reason });
export const rejectPlan = (id, reason) =>
  post(`/plans/${id}/reject`, { reason });
export const updateBrief = (id, body) =>
  agentAxios.patch(`/briefs/${id}`, body);

export const getContentList = (params) => get("/content", params);
export const getContent = (id) => get(`/content/${id}`);
export const getContentChecks = (id) => get(`/content/${id}/checks`);
export const getContentVersions = (id) => get(`/content/${id}/versions`);
export const generateContent = (body) => post("/content/generate", body);
export const recheckContent = (id) => post(`/content/${id}/check`);
export const editContent = (id, body) => put(`/content/${id}`, { body });
export const reviseContent = (id, feedback) =>
  post(`/content/${id}/revise`, { feedback });
export const approveContent = (id, reason) =>
  post(`/content/${id}/approve`, { reason });
export const generateContentImage = (id, prompt) =>
  post(`/content/${id}/image`, prompt ? { prompt } : null);
export const uploadContentImage = (id, file) =>
  agentAxios.put(`/content/${id}/image`, file, {
    headers: { "Content-Type": file.type },
  });
export const removeContentImage = (id) =>
  agentAxios.delete(`/content/${id}/image`);
export const uploadContentVideo = (id, file, onProgress) =>
  agentAxios.put(`/content/${id}/video`, file, {
    headers: { "Content-Type": file.type },
    timeout: 0,
    onUploadProgress: (e) =>
      onProgress &&
      e.total &&
      onProgress(Math.round((e.loaded / e.total) * 100)),
  });
export const makeReel = (id, script) =>
  post(`/content/${id}/reel`, script ? { script } : null);
export const removeContentVideo = (id) =>
  agentAxios.delete(`/content/${id}/video`);
export const rejectContent = (id, reason) =>
  post(`/content/${id}/reject`, { reason });

export const getPublications = (params) => get("/publications", params);
export const schedulePublication = (body) => post("/publications", body);
export const cancelPublication = (id) => post(`/publications/${id}/cancel`);
export const markPublished = (id, url) =>
  post(`/publications/${id}/mark-published`, { url });
export const runPublish = () => post("/publish/run");
export const getControls = () => get("/controls");
export const setControls = (body) => put("/controls", body);

export const getBudgets = (params) => get("/ads/budgets", params);
export const setBudget = (body) => put("/ads/budgets", body);
export const getCampaigns = (params) => get("/ads/campaigns", params);
export const proposeCampaign = (body) => post("/ads/campaigns", body);
export const approveCampaign = (id) => post(`/ads/campaigns/${id}/approve`);
export const rejectCampaign = (id) => post(`/ads/campaigns/${id}/reject`);
export const pauseCampaign = (id, reason) =>
  post(`/ads/campaigns/${id}/pause`, { reason });
export const resumeCampaign = (id) => post(`/ads/campaigns/${id}/resume`);
export const changeCampaignBudget = (id, body) =>
  post(`/ads/campaigns/${id}/budget`, body);
export const getBudgetChanges = (params) => get("/ads/budget-changes", params);
export const approveBudgetChange = (id) =>
  post(`/ads/budget-changes/${id}/approve`);
export const rejectBudgetChange = (id) =>
  post(`/ads/budget-changes/${id}/reject`);
export const syncAds = () => post("/ads/sync");

export const getCallQueue = (params) => get("/enquiries/queue", params);
export const getEnquiries = (params) => get("/enquiries", params);
export const getEnquiry = (id) => get(`/enquiries/${id}`);
export const recordOutcome = (id, body) =>
  post(`/enquiries/${id}/outcome`, body);
export const acknowledgeCrisis = (id) =>
  post(`/enquiries/${id}/crisis/acknowledge`);

export const getMetrics = (params) => get("/learn/metrics", params);
export const runLearn = (kind) => post("/learn/run", null, { kind });
export const getReports = (params) => get("/learn/reports", params);
export const getHooks = (params) => get("/learn/hooks", params);

export const getFacts = (params) => get("/facts", params);
export const addFact = (body) => post("/facts", body);
export const retireFact = (id) => post(`/facts/${id}/retire`);
export const updateFact = (id, body) => agentAxios.patch(`/facts/${id}`, body);
export const deleteFact = (id) => agentAxios.delete(`/facts/${id}`);
export const getBannedPhrases = (params) => get("/banned-phrases", params);
export const addBannedPhrase = (body) => post("/banned-phrases", body);
export const removeBannedPhrase = (id) =>
  agentAxios.delete(`/banned-phrases/${id}`);
export const getWebsitePages = (params) => get("/website/pages", params);
export const searchWebsite = (body) => post("/website/search", body);
export const crawlWebsite = (embed) => post("/website/crawl", null, { embed });
export const getVoiceGuide = () => get("/voice-guide");
export const setVoiceGuide = (body) => put("/voice-guide", body);
export const getPlaybook = (city) => get(`/playbooks/${city}`);
export const setPlaybook = (city, body) => put(`/playbooks/${city}`, body);
export const getImageFaces = (contentId) =>
  get(`/content/${contentId}/image/faces`);
export const blurContentImage = (contentId, shapes, intensity) =>
  post(`/content/${contentId}/image/blur`, { shapes, intensity });
export const getOwnerSettings = () => get("/owner/settings");
export const setApprovalRules = (body) => put("/owner/approval-rules", body);
export const getOwnerHistory = (params) => get("/owner/history", params);
export const getPlanReadiness = (params) => get("/plans/readiness", params);
export const recalculateAdSuggestion = (weekId) =>
  post(`/plans/${weekId}/ad-suggestion/recalculate`);
export const approveAdSuggestion = (weekId) =>
  post(`/plans/${weekId}/ad-suggestion/approve`);
export const rejectAdSuggestion = (weekId) =>
  post(`/plans/${weekId}/ad-suggestion/reject`);
