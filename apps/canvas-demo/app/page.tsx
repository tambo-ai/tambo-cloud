"use client";

import { useContext, useState, useEffect } from "react";
import { CanvasInterface } from "@/components/CanvasInterface";
import { ActiveTabContext } from "@/contexts/ActiveTabContext";
import { WelcomeModal } from "@/components/WelcomeModal";

export default function Home() {
  const { activeTab } = useContext(ActiveTabContext)!;
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setShowModal(true);
  }, []);

  return (
    <>
      <CanvasInterface activeTab={activeTab} />
      <WelcomeModal isOpen={showModal} onOpenChange={setShowModal} />
    </>
  );
}
