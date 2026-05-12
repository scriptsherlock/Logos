import { useEffect, useState } from "react";
import type { User } from "../services/types";

const STORAGE_KEY = "logos.activeUser";
const USER_EVENT = "logos.activeUserChanged";

export function getStoredActiveUser(): User | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function storeActiveUser(user: User) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(USER_EVENT));
}

export function clearActiveUser() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(USER_EVENT));
}

export function useActiveUser() {
  const [user, setUser] = useState<User | null>(() => getStoredActiveUser());

  useEffect(() => {
    function syncUser() {
      setUser(getStoredActiveUser());
    }
    window.addEventListener("storage", syncUser);
    window.addEventListener(USER_EVENT, syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener(USER_EVENT, syncUser);
    };
  }, []);

  function saveUser(nextUser: User) {
    storeActiveUser(nextUser);
    setUser(nextUser);
  }

  function clearUser() {
    clearActiveUser();
    setUser(null);
  }

  return {
    user,
    saveUser,
    clearUser,
    studentId: user?.role === "student" ? user.studentId : undefined,
  };
}
