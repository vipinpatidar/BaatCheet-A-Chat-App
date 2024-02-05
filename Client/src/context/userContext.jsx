import { createContext, useState, useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { makeRequest } from "../utils/axios";
import { useNavigate } from "react-router-dom";

const UserContext = createContext({
  _id: "",
  email: "",
  name: "",
  image: "",
  status: "",
  setId: () => {},
});

const UserState = () => {
  return useContext(UserContext);
};

const UserContextProvider = ({ children }) => {
  const [id, setId] = useState(
    JSON.parse(localStorage.getItem("userInfo"))?.userId || null
  );

  const navigate = useNavigate();

  const {
    data: loggedInUser,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      const res = await makeRequest.get(`/user/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  let context;

  if (!isLoading) {
    context = {
      ...loggedInUser,
      setId,
    };
  }

  // console.log(error);

  useEffect(() => {
    if (error?.response?.status === 403) {
      navigate("/");
      setId(null);
      localStorage.removeItem("userInfo");
      window.location.href = "/";
    }
    //eslint-disable-next-line
  }, [error, setId]);

  return (
    <UserContext.Provider value={context}>{children}</UserContext.Provider>
  );
};

export { UserContextProvider, UserContext, UserState };
