// app/context/UserContext.js
"use client";

import { createContext, useContext, useState } from "react";

const UserContext = createContext();

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);           // Firebase 인증 유저
  const [initialData, setInitialData] = useState(null); // 유저와 연결된 초기 데이터
  const [dataLoading, setDataLoading] = useState(null); // 데이터 로딩중?

  return (
    <UserContext.Provider value={{ user, setUser, initialData, setInitialData, dataLoading, setDataLoading }}>
      {children}
    </UserContext.Provider>
  );
}
