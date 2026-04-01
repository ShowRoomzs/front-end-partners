import { createStore } from "@/common/stores/createStore"
import type { Role } from "@/common/types/role"
import type { MarketInfo } from "@/features/auth/services/authService"

interface MarketStore {
  market: MarketInfo | null
  role: Role | null
  setMarket: (user: MarketInfo) => void
  setRole: (role: Role) => void
  clear: () => void
}

export const useMarketStore = createStore<MarketStore>({
  creator: set => ({
    market: null,
    role: null,
    setMarket: market => set({ market }),
    setRole: role => set({ role }),
    clear: () => set({ market: null }),
  }),
})
