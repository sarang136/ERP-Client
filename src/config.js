module.exports = {
  google: {
    API_KEY: "",
    CLIENT_ID: "",
    SECRET: "",
  },
  facebook: {
    APP_ID: "",
  },
  api: {
    BASE_URL: process.env.REACT_APP_BASE_URL || "",
    API_URL: process.env.REACT_APP_API_URL || "",
    AUTH_SERVICE_URL: process.env.REACT_APP_AUTH_SERVICE_URL || "",
    CCTV_SERVICE_URL: process.env.REACT_APP_CCTV_SERVICE_URL || "",
    REPORTS_MAKER_BASE_URL: process.env.REACT_APP_REPORTS_MAKER_BASE_URL || "",
    MARKETING_AGENT_URL: process.env.REACT_APP_MARKETING_AGENT_URL || "",
  },
};
