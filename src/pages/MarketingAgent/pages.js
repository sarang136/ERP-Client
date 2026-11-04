import Signals from "./Signals";
import ListenData from "./ListenData";
import Plans from "./Plans";
import RagOutput from "./RagOutput";
import ContentReview from "./ContentReview";
import Publishing from "./Publishing";
import Ads from "./Ads";
import Enquiries from "./Enquiries";
import Insights from "./Insights";
import BrandBrain from "./BrandBrain";
import OwnerSettings from "./OwnerSettings";

export const MODULE = "MARKETING_AGENT";

export const AGENT_PAGES = [
  {
    id: "enquiries",
    path: "enquiries",
    label: "Call Queue",
    icon: "bx bx-phone-call",
    permission: "ENQUIRIES",
    component: Enquiries,
  },
  {
    id: "content",
    path: "content",
    label: "Content Review",
    icon: "bx bx-check-shield",
    permission: "CONTENT",
    component: ContentReview,
  },
  {
    id: "plans",
    path: "plans",
    label: "Weekly Plans",
    icon: "bx bx-calendar-week",
    permission: "PLANS",
    component: Plans,
  },
  {
    id: "rag",
    path: "rag",
    label: "RAG Output",
    icon: "bx bx-data",
    permission: "PLANS",
    component: RagOutput,
  },
  {
    id: "signals",
    path: "signals",
    label: "Signals",
    icon: "bx bx-search-alt",
    permission: "SIGNALS",
    component: Signals,
  },
  {
    id: "listen-data",
    path: "listen-data",
    label: "Listen Data",
    icon: "bx bx-bar-chart-alt-2",
    permission: "SIGNALS",
    component: ListenData,
  },
  {
    id: "publishing",
    path: "publishing",
    label: "Publishing",
    icon: "bx bx-send",
    permission: "PUBLISHING",
    component: Publishing,
  },
  {
    id: "ads",
    path: "ads",
    label: "Ads & Budgets",
    icon: "bx bx-wallet",
    permission: "ADS",
    component: Ads,
  },
  {
    id: "insights",
    path: "insights",
    label: "Insights",
    icon: "bx bx-line-chart",
    permission: "INSIGHTS",
    component: Insights,
  },
  {
    id: "brand",
    path: "brand",
    label: "Brand Brain",
    icon: "bx bx-book-content",
    permission: "BRAND",
    component: BrandBrain,
  },
  {
    id: "owner",
    path: "owner",
    label: "Owner Settings",
    icon: "bx bx-shield-quarter",
    permission: "BRAND",
    component: OwnerSettings,
  },
];
