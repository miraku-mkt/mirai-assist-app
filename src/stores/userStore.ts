import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import CryptoJS from 'crypto-js'
import { User } from '@/types'

interface UserState {
  users: User[]
  currentUser: User | null
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateUser: (id: string, updates: Partial<User>) => void
  deleteUser: (id: string) => void
  setCurrentUser: (user: User | null) => void
  getUserById: (id: string) => User | undefined
  getAnonymizedUsers: () => Array<{ id: string; anonymizedName: string; updatedAt: Date }>
  clearAllData: () => void
}

const ENCRYPTION_KEY = 'mirai-assist-encryption-key-2024'

const encryptData = (data: string): string => {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString()
}

const decryptData = (encryptedData: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
    return bytes.toString(CryptoJS.enc.Utf8)
  } catch {
    return encryptedData // 暗号化されていない場合はそのまま返す
  }
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      users: [],
      currentUser: null,

      addUser: (userData) => {
        const now = new Date()
        const userCount = get().users.length + 1
        const anonymizedName = `利用者${String.fromCharCode(64 + userCount)}` // A, B, C...
        const id = crypto.randomUUID()
        
        const newUser: User = {
          ...userData,
          id,
          anonymizedName,
          actualName: encryptData(userData.actualName),
          createdAt: now,
          updatedAt: now
        }

        set((state) => ({
          users: [...state.users, newUser]
        }))
        
        return id
      },

      updateUser: (id, updates) => {
        set((state) => ({
          users: state.users.map((user) =>
            user.id === id
              ? {
                  ...user,
                  ...updates,
                  actualName: updates.actualName 
                    ? encryptData(updates.actualName)
                    : user.actualName,
                  updatedAt: new Date()
                }
              : user
          ),
          currentUser: state.currentUser?.id === id
            ? { ...state.currentUser, ...updates, updatedAt: new Date() }
            : state.currentUser
        }))
      },

      deleteUser: (id) => {
        set((state) => ({
          users: state.users.filter((user) => user.id !== id),
          currentUser: state.currentUser?.id === id ? null : state.currentUser
        }))
      },

      setCurrentUser: (user) => {
        set({ currentUser: user })
      },

      getUserById: (id) => {
        const user = get().users.find((u) => u.id === id)
        if (user) {
          return {
            ...user,
            actualName: decryptData(user.actualName)
          }
        }
        return undefined
      },

      getAnonymizedUsers: () => {
        return get().users.map((user) => ({
          id: user.id,
          anonymizedName: user.anonymizedName,
          updatedAt: user.updatedAt
        }))
      },

      clearAllData: () => {
        set({
          users: [],
          currentUser: null
        })
      }
    }),
    {
      name: 'mirai-assist-users',
      partialize: (state) => ({
        users: state.users
      })
    }
  )
)