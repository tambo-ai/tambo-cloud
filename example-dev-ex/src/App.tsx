import { type ReactElement } from "react";
import HydraProvider from "./HydraProvider";
import { MessageThread } from "./components/MessageThread";

export const App = (): ReactElement => {
  return (
    <HydraProvider>
      <MessageThread />
    </HydraProvider>
  );
};
