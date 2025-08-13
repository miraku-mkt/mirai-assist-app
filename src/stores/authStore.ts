import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import CryptoJS from 'crypto-js'

interface AuthState {
  isAuthenticated: boolean
  pin: string | null
  lastAuthTime: Date | null
  authenticate: (pin: string) => boolean
  logout: () => void
  setPin: (pin: string) => void
  checkAuthExpiry: () => void
}

const AUTH_EXPIRY_TIME = 8 * 60 * 60 * 1000 // 8時間

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      pin: null,
      lastAuthTime: null,

      authenticate: (pin: string) => {
        const state = get()
        
        // 初回設定の場合
        if (!state.pin) {
          const hashedPin = CryptoJS.SHA256(pin).toString()
          set({
            isAuthenticated: true,
            pin: hashedPin,
            lastAuthTime: new Date()
          })
          return true
        }

        // PIN確認
        const hashedPin = CryptoJS.SHA256(pin).toString()
        if (hashedPin === state.pin) {
          set({
            isAuthenticated: true,
            lastAuthTime: new Date()
          })
          return true
        }

        return false
      },

      logout: () => {
        set({
          isAuthenticated: false,
          lastAuthTime: null
        })
      },

      setPin: (pin: string) => {
        const hashedPin = CryptoJS.SHA256(pin).toString()
        set({ pin: hashedPin })
      },

      checkAuthExpiry: () => {
        const state = get()
        if (state.lastAuthTime) {
          const now = new Date().getTime()
          const lastAuth = new Date(state.lastAuthTime).getTime()
          
          if (now - lastAuth > AUTH_EXPIRY_TIME) {
            set({
              isAuthenticated: false,
              lastAuthTime: null
            })
          }
        }
      }
    }),
    {
      name: 'mirai-assist-auth',
      partialize: (state) => ({
        pin: state.pin,
        lastAuthTime: state.lastAuthTime
      })
    }
  )
)