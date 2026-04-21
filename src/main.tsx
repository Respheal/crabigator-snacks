import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "./components/ui/provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App.tsx";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ColorModeButton } from "./components/ui/color-mode.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60, // 1 hour
      staleTime: Infinity,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider>
        <ColorModeButton />
        <App />
      </Provider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  </StrictMode>,
);
