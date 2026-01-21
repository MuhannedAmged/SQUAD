import { Language } from "./translations";

export const getLastSeen = (
  dateString: string | null | undefined,
  t: (key: any) => string
) => {
  if (!dateString) return t("offline");

  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return t("justNow");

  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins} ${t("m")} ${t("ago")}`;
  }

  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${t("h")} ${t("ago")}`;
  }

  if (diffInSeconds < 604800) {
    // 7 days
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${t("d")} ${t("ago")}`;
  }

  return date.toLocaleDateString();
};
