import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import CryptoJS from 'crypto-js'
import { InterviewSession } from '@/types'

interface InterviewStore {
  interviews: InterviewSession[]
  
  // 面談記録の取得
  getInterviewsByUserId: (userId: string) => InterviewSession[]
  getInterviewById: (id: string) => InterviewSession | undefined
  getUpcomingInterviews: (days?: number) => InterviewSession[]
  
  // 面談記録の操作
  addInterview: (interview: Omit<InterviewSession, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateInterview: (id: string, updates: Partial<InterviewSession>) => void
  deleteInterview: (id: string) => void
  
  // 面談ステータスの更新
  markInterviewCompleted: (id: string, actualDate: Date, notes?: string) => void
  rescheduleInterview: (id: string, newDate: Date, reason?: string) => void
  cancelInterview: (id: string, reason?: string) => void
  
  // 暗号化関連
  encryptSensitiveData: (data: any) => string
  decryptSensitiveData: (encryptedData: string) => any
}

// 暗号化キー（実際の運用では環境変数など安全な場所から取得）
const ENCRYPTION_KEY = 'mirai-assist-interview-data-key-2024'

const useInterviewStore = create<InterviewStore>()(
  persist(
    (set, get) => ({
      interviews: [],

      // 面談記録の取得
      getInterviewsByUserId: (userId: string) => {
        return get().interviews
          .filter(interview => interview.userId === userId)
          .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
      },

      getInterviewById: (id: string) => {
        return get().interviews.find(interview => interview.id === id)
      },

      getUpcomingInterviews: (days = 7) => {
        const now = new Date()
        const futureDate = new Date()
        futureDate.setDate(now.getDate() + days)
        
        return get().interviews
          .filter(interview => 
            interview.status === 'scheduled' && 
            new Date(interview.scheduledDate) >= now &&
            new Date(interview.scheduledDate) <= futureDate
          )
          .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
      },

      // 面談記録の操作
      addInterview: (interviewData) => {
        const id = crypto.randomUUID()
        const now = new Date()
        
        const newInterview: InterviewSession = {
          ...interviewData,
          id,
          createdAt: now,
          updatedAt: now
        }

        set(state => ({
          interviews: [...state.interviews, newInterview]
        }))

        return id
      },

      updateInterview: (id, updates) => {
        set(state => ({
          interviews: state.interviews.map(interview =>
            interview.id === id
              ? { ...interview, ...updates, updatedAt: new Date() }
              : interview
          )
        }))
      },

      deleteInterview: (id) => {
        set(state => ({
          interviews: state.interviews.filter(interview => interview.id !== id)
        }))
      },

      // 面談ステータスの更新
      markInterviewCompleted: (id, actualDate, notes) => {
        const updates: Partial<InterviewSession> = {
          status: 'completed' as const,
          actualDate,
          updatedAt: new Date()
        }
        
        if (notes) {
          updates.notes = notes
        }

        get().updateInterview(id, updates)
      },

      rescheduleInterview: (id, newDate, reason) => {
        const updates: Partial<InterviewSession> = {
          status: 'rescheduled' as const,
          scheduledDate: newDate,
          updatedAt: new Date()
        }

        if (reason) {
          const currentInterview = get().getInterviewById(id)
          if (currentInterview) {
            updates.notes = currentInterview.notes 
              ? `${currentInterview.notes}\n\n【変更理由】${reason}`
              : `【変更理由】${reason}`
          }
        }

        get().updateInterview(id, updates)
      },

      cancelInterview: (id, reason) => {
        const updates: Partial<InterviewSession> = {
          status: 'cancelled' as const,
          updatedAt: new Date()
        }

        if (reason) {
          const currentInterview = get().getInterviewById(id)
          if (currentInterview) {
            updates.notes = currentInterview.notes 
              ? `${currentInterview.notes}\n\n【キャンセル理由】${reason}`
              : `【キャンセル理由】${reason}`
          }
        }

        get().updateInterview(id, updates)
      },

      // 暗号化関連
      encryptSensitiveData: (data) => {
        return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString()
      },

      decryptSensitiveData: (encryptedData) => {
        try {
          const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
          return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
        } catch (error) {
          console.error('暗号化データの復号に失敗しました:', error)
          return null
        }
      }
    }),
    {
      name: 'mirai-assist-interviews',
      partialize: (state) => ({ interviews: state.interviews })
    }
  )
)

export { useInterviewStore }