import Cookies from "js-cookie";

const USER_DATA_KEY = "squad_user_data";

export const setCookieData = (data: any) => {
  Cookies.set(USER_DATA_KEY, JSON.stringify(data), {
    expires: 7, // 7 days
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};

export const getCookieData = () => {
  const data = Cookies.get(USER_DATA_KEY);
  return data ? JSON.parse(data) : null;
};

export const removeCookieData = () => {
  Cookies.remove(USER_DATA_KEY);
};
