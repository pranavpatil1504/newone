import axios from "axios";

// export const SERVER_URL = "http://localhost:5000";

const API = axios.create({
  baseURL: `${SERVER_URL}/api`,
});

// Interceptor to add auth token to every request
API.interceptors.request.use((req) => {
  const token = sessionStorage.getItem("authToken");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const registerUser = async (userData) => {
  const response = await API.post("/auth/register", userData);
  return response.data;
};

// --- AUTH FUNCTIONS ---
export const loginUser = async (credentials) => {
  const response = await API.post("/auth/login", credentials);
  return response.data;
};

// --- DATA FETCHING ---
export const getMyAssignedProjects = async () => {
  const response = await API.get("/projects/my-projects");
  return response.data;
};

export const getProjectDetails = async (projectId) => {
  const response = await API.get(`/projects/${projectId}`);
  return response.data;
};

// Videos Fetching
export const getVideosForProject = async (projectUsername) => {
  const response = await API.get(`/videos/project/${projectUsername}`);
  return response.data;
};

export const getVideosByProjectId = async (projectId) => {
  const response = await API.get(`/videos/by-project/${projectId}`);
  return response.data;
};

// Photo Albums Fetching
export const getPhotosByProjectId = async (projectId) => {
  const response = await API.get(`/photos/by-project/${projectId}`);
  return response.data;
};

export const getAlbumImages = async (albumId) => {
  const response = await API.get(`/photos/album/${albumId}`);
  return response.data;
};

// Pano Albums Fetching
export const getPanoramaAlbumsByProjectId = async (projectId) => {
  const response = await API.get(`/panoramas/by-project/${projectId}`);
  return response.data;
};

export const getPanoramaAlbumImages = async (albumId) => {
  const response = await API.get(`/panoramas/album/${albumId}`);
  return response.data;
};
