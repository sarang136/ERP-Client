import axios from "axios";
import { api } from "../config";
import history from "../Routes/HistoryRoute";
import Cookies from "js-cookie";

// ✅ Main Axios setup (unchanged)
axios.defaults.baseURL = api.API_URL;
axios.defaults.headers.post["Content-Type"] = "application/json";
axios.defaults.headers.post["credentials"] = "include";
axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;
const authUser = localStorage.getItem("authUser");
const token = authUser ? JSON.parse(authUser).token : null;

// let token = null;
// try {
//   const persistRoot = JSON.parse(localStorage.getItem("persist:root"));
//   const userState = persistRoot?.User;
//   const user = userState ? JSON.parse(userState).user : null;
//   token = user?.token || null;
// } catch (e) {
// }

if (token) {
  axios.defaults.headers.common["Authorization"] = "Bearer " + token;
} else {
  delete axios.defaults.headers.common["Authorization"];
}

const isDraftKey = (key) =>
  key.startsWith("detail_admission_draft_") ||
  key.startsWith("detail_admission_audio_") ||
  key.startsWith("detailAdmissionDraft_");

function handleLogout() {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (!isDraftKey(key)) localStorage.removeItem(key);
    });
    Cookies.remove("jajantarammamantaram");
    Cookies.remove("token");
    Cookies.remove("XSRF-TOKEN");
    history.replace("/login");
  } catch (err) {
    Object.keys(localStorage).forEach((key) => {
      if (!isDraftKey(key)) localStorage.removeItem(key);
    });
    Cookies.remove("jajantarammamantaram");
    Cookies.remove("token");
    Cookies.remove("XSRF-TOKEN");
    history.replace("/login");
  }
}

const CSRF_COOKIE = "XSRF-TOKEN";
let csrfRefreshPromise = null;

const refreshCsrfToken = () => {
  if (!csrfRefreshPromise) {
    csrfRefreshPromise = authAxios
      .get("/csrf-token", { _skipCsrfRetry: true })
      .finally(() => {
        csrfRefreshPromise = null;
      });
  }
  return csrfRefreshPromise;
};

// Call before the app renders.
const ensureCsrf = async () => {
  try {
    if (Cookies.get(CSRF_COOKIE)) return true;
    await refreshCsrfToken();
    return true;
  } catch (err) {
    return false;
  }
};

const isCsrfFailure = (status, body) => {
  if (status !== 400 && status !== 401 && status !== 403) return false;
  if (body?.code === "CSRF_INVALID" || body?.data?.code === "CSRF_INVALID") {
    return true;
  }
  return !Cookies.get(CSRF_COOKIE);
};

const readErrorBody = async (error) => {
  const raw = error.response?.data;
  if (raw instanceof Blob && raw.type === "application/json") {
    try {
      return JSON.parse(await raw.text());
    } catch (e) {
    }
  }
  return raw;
};
const recoverFromCsrfFailure = async (instance, error, body) => {
  const cfg = error.config;
  if (!cfg || cfg._csrfRetried || cfg._skipCsrfRetry) return null;
  if (!isCsrfFailure(error.response?.status, body)) return null;

  cfg._csrfRetried = true;
  try {
    await refreshCsrfToken();
    return { value: await instance(cfg) };
  } catch (e) {
    return null;
  }
};


// main API request interceptor
axios.interceptors.request.use((config) => {
  const microUser = localStorage.getItem("micrologin");
  const token = microUser ? JSON.parse(microUser).token : null;

  if (config.headers["X-No-Cookie-Token"] === "true") {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }

  return config;
});


// ✅ Main API response interceptor
axios.interceptors.response.use(
  function (response) {
    if (response.config?.responseType === "blob") {
      return response;
    }
    return response.data ? response.data : response;
  },
  async function (error) {
    const errorData = await readErrorBody(error);

    const replayed = await recoverFromCsrfFailure(axios, error, errorData);
    if (replayed) return replayed.value;

    if (errorData?.logout) {
      handleLogout();
    }
    return Promise.reject(
      errorData || { message: "Something went wrong!" }
    );
  }
);

// ✅ Optional token setter
const setAuthorization = (token) => {
  axios.defaults.headers.common["Authorization"] = "Bearer " + token;
};

// ✅ Separate Axios instance for AUTH_SERVICE_URL
const authAxios = axios.create({
  baseURL: api.AUTH_SERVICE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  credentials: "include",
});

// ✅ Automatically set token for authAxios
const microUser = localStorage.getItem("micrologin");
const microToken = microUser ? JSON.parse(microUser).token : null;
if (microToken) {
  authAxios.defaults.headers.common["Authorization"] = "Bearer " + microToken;
}

// ✅ Optional interceptor for authAxios (optional)
authAxios.interceptors.response.use(
  (response) => (response.data ? response.data : response),
  async (error) => {
    const errorData = await readErrorBody(error);

    const replayed = await recoverFromCsrfFailure(authAxios, error, errorData);
    if (replayed) return replayed.value;

    return Promise.reject(
      errorData || { message: "Auth service error!" }
    );
  }
);

// ✅ Reusable API client (for main API_URL)
class APIClient {
  get = (url, params) => {
    let response;
    let paramKeys = [];

    if (params) {
      Object.keys(params).forEach((key) => {
        paramKeys.push(`${key}=${params[key]}`);
      });

      const queryString = paramKeys.length > 0 ? paramKeys.join("&") : "";
      response = axios.get(`${url}?${queryString}`, params);
    } else {
      response = axios.get(`${url}`, params);
    }

    return response;
  };

  create = (url, data, config) => {
    return axios.post(url, data, config);
  };

  update = (url, data, config) => {
    return axios.patch(url, data, config);
  };

  put = (url, data, config) => {
    return axios.put(url, data, config);
  };

  delete = (url, config) => {
    return axios.delete(url, { ...config });
  };
}

// ✅ Auth API client (for AUTH_SERVICE_URL)
class AuthAPIClient {
  get = (url, config = {}) => authAxios.get(url, config);
  post = (url, data, config = {}) => authAxios.post(url, data, config);
  put = (url, data, config = {}) => authAxios.put(url, data, config);
  patch = (url, data, config = {}) => authAxios.patch(url, data, config);
  delete = (url, config = {}) => authAxios.delete(url, { ...config });
}

// ✅ Get logged-in user
// const getLoggedinUser = () => {
//   try {
//     const persistRoot = JSON.parse(localStorage.getItem("persist:root"));
//     const userState = persistRoot?.User;
//     const user = userState ? JSON.parse(userState).user : null;
//     return user;
//   } catch (e) {
//     return null;
//   }
// };

const getLoggedinUser = () => {
  const user = localStorage.getItem("authUser");
  if (!user) {
    return null;
  } else {
    return JSON.parse(user);
  }
};

export {
  APIClient,
  AuthAPIClient,
  setAuthorization,
  getLoggedinUser,
  ensureCsrf,
};
