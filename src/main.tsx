import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"
import "./index.css"
import App from "./App.tsx"
import { Toaster } from "react-hot-toast"
import { queryClient } from "@/common/lib/queryClient.ts"
import { CookiesProvider } from "react-cookie"
import { TOAST_OPTIONS } from "@/common/constants/toast.ts"
import ConfirmProvider from "@/common/components/ConfirmModal/ConfirmProvider"
import ErrorBoundary from "@/common/components/ErrorBoundary/ErrorBoundary"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CookiesProvider>
      <QueryClientProvider client={queryClient}>
          <ConfirmProvider>
            <ErrorBoundary>
              <Toaster position="top-right" toastOptions={TOAST_OPTIONS} />
              <App />
            </ErrorBoundary>
          </ConfirmProvider>
      </QueryClientProvider>
    </CookiesProvider>
  </StrictMode>
)
