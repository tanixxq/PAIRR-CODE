export const saveToken = (token) => {
    localStorage.setItem("paircode_token", token);
  };
  
  export const getToken = () => {
    return localStorage.getItem("paircode_token");
  };
  
  export const removeToken = () => {
    localStorage.removeItem("paircode_token");
  };
  
  export const isLoggedIn = () => {
    return !!getToken();
  };