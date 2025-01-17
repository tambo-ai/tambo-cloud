"use client";

import { ChatMessageProps } from "@/types/chat";
import React, { createContext, useState, useContext, useCallback } from "react";
import { posthog } from "@/app/providers";

type ActiveTabContextType = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  chatMessages: ChatMessageProps[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessageProps[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

export const ActiveTabContext = createContext<ActiveTabContextType | undefined>(
  undefined
);

export function ActiveTabProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, _setActiveTab] = useState("canvas");
  const [chatMessages, setChatMessages] = useState<ChatMessageProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const setActiveTab = useCallback(
    (newTab: string) => {
      posthog?.capture("tab_switched", {
        from_tab: activeTab,
        to_tab: newTab,
        session_duration_ms:
          Date.now() - window.performance.timing.navigationStart,
      });
      _setActiveTab(newTab);
    },
    [activeTab]
  );

  return (
    <ActiveTabContext.Provider
      value={{
        activeTab,
        setActiveTab,
        chatMessages,
        setChatMessages,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </ActiveTabContext.Provider>
  );
}

export function useActiveTab() {
  const context = useContext(ActiveTabContext);
  if (context === undefined) {
    throw new Error("useActiveTab must be used within an ActiveTabProvider");
  }
  return context;
}
