import { HydraProvider as HydraContextProvider } from "hydra-ai-react";
import { type ReactNode } from "react";
import { initializeHydra } from "./config/hydraConfig";

interface HydraProviderProps {
  children: ReactNode;
}

const HydraProvider = ({
  children,
}: Readonly<HydraProviderProps>): JSX.Element => {
  return (
    <HydraContextProvider hydraInstance={initializeHydra()}>
      {children}
    </HydraContextProvider>
  );
};

export default HydraProvider;
