import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4000/api",
});

// Attach token to EVERY request fresh from localStorage
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("pf_token");
  console.log("Sending request with token:", token ? "EXISTS" : "MISSING");
  if (token && token !== "null" && token !== "undefined") {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto logout on 401
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("pf_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const getPlatformStatus = () => API.get("/platforms/status");
export const transformPost = (content: string, platforms: string[]) =>
  API.post("/ai/transform", { content, platforms });
// ✅ FIX: Enhanced for Multipart/FormData (Media Uploads)
export const schedulePost = (data: FormData | any) => {
  const isFormData = data instanceof FormData;
  
  return API.post("/posts/schedule", data, {
    headers: {
      // Let the browser handle the Content-Type if it's FormData
      ...(isFormData ? { "Content-Type": "multipart/form-data" } : {}),
    },
  });
};
export const getPosts     = ()           => API.get("/posts");
export const deletePost   = (id: number) => API.delete(`/posts/${id}`);

export default API;