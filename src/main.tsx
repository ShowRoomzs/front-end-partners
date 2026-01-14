import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import "./index.css"
import App from "./App.tsx"
import { Toaster } from "react-hot-toast"
import { queryClient } from "@/common/lib/queryClient.ts"
import { CookiesProvider } from "react-cookie"
import { TOAST_OPTIONS } from "@/common/constants/toast.ts"
import ConfirmProvider from "@/common/components/ConfirmModal/ConfirmProvider"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <CookiesProvider>
        <QueryClientProvider client={queryClient}>
          <ConfirmProvider>
            <Toaster position="top-right" toastOptions={TOAST_OPTIONS} />
            <App />
          </ConfirmProvider>
        </QueryClientProvider>
      </CookiesProvider>
    </BrowserRouter>
  </StrictMode>
)
