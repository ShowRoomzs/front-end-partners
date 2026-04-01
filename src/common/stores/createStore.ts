import { create, type StateCreator } from "zustand"
import {
  persist,
  type PersistStorage,
  type StorageValue,
} from "zustand/middleware"
import { immer } from "zustand/middleware/immer"

type ImmerStore<T> = StateCreator<T, [["zustand/immer", never]], []>

interface CreateStoreParams<T> {
  creator: ImmerStore<T>
  storageKey?: string // AsyncStorage 키 (persist 사용 시에만)
}

const createJSONStorage = <T>(): PersistStorage<T> => ({
  getItem: (name: string): StorageValue<T> | null => {
    try {
      const value = localStorage.getItem(name)

      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error(`Failed to get item with name: ${name}`, error)
      return null
    }
  },
  setItem: (name: string, value: StorageValue<T>): void => {
    try {
      localStorage.setItem(name, JSON.stringify(value))
    } catch (error) {
      console.error(`Failed to set item with name: ${name}`, error)
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name)
    } catch (error) {
      console.error(`Failed to remove item with name: ${name}`, error)
    }
  },
})

export function createStore<T>(params: CreateStoreParams<T>) {
  const { creator, storageKey } = params

  if (!storageKey) {
    return create<T>()(immer(creator))
  }

  return create<T>()(
    persist(immer(creator), {
      name: storageKey,
      storage: createJSONStorage<T>(),
    })
  )
}
