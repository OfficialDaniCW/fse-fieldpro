import React, { createContext, useContext } from "react";

export const ConnectionBannerContext = createContext(null);

export function useConnectionBanner() {
  return useContext(ConnectionBannerContext);
}