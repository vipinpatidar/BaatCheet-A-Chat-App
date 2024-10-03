import axios from "axios";

axios.defaults.withCredentials = true;

// Create a function to retrieve the token from sessionStorage
const getToken = () => {
  const persistedState = localStorage.getItem("userInfo");
  // console.log(persistedState);

  if (persistedState) {
    const userObject = JSON.parse(persistedState);

    if (userObject && userObject.token) {
      return userObject.token;
    }
  }

  return null;
};
// console.log(getToken());
/*
// Create a function to make requests with the Authorization header
export const token = () => {
  const tokenValue = getToken();

  const headers = {
    "Content-Type": "application/json",
  };

  // Add Authorization header if a token is available
  if (tokenValue) {
    headers.Authorization = `Bearer ${tokenValue}`;
  }

  return headers;
};

*/

// console.log(token());

export const makeRequest = axios.create({
  baseURL: `${import.meta.env.VITE_ENDPOINT}/api/v1`,
  withCredentials: true,
  // headers: token(),
  signal: new AbortController().signal,
});

makeRequest.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    config.headers["Content-Type"] = "application/json";

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);
