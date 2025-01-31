import { HydraProvider } from "hydra-ai-react";
import { type ReactElement } from "react";
import { MessageThread } from "./components/MessageThread";
import { initializeHydra } from "./config/hydraConfig";

export const App = (): ReactElement => {
  const hydraInstance = initializeHydra();

  return (
    <HydraProvider hydraInstance={hydraInstance}>
      <div>
        <h1>Hydra AI Demo</h1>
        <MessageThread />
      </div>
    </HydraProvider>
  );
};
