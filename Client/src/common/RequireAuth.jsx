import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { UserState } from "../context/userContext";

const RequireAuth = ({ children }) => {
  const [id] = useState(
    JSON.parse(localStorage.getItem("userInfo"))?.userId || null
  );
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const user = UserState();

  useEffect(() => {
    setIsLoading(false);
    //eslint-disable-next-line
  }, [id, user]);

  if (isLoading) {
    return null;
  }

  // Check if user information is still being loaded

  // Check if user is authenticated
  if (!id && !user) {
    return <Navigate to={"/"} replace state={{ path: location.pathname }} />;
  }

  return children;
};

export default RequireAuth;
