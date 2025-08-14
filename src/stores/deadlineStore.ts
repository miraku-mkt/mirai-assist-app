import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DocumentDeadline {
  id: string
  documentId?: string
  userId: string
  documentType: 'servicePlan' | 'weeklySchedule' | 'needsAssessment' | 'monitoringReport'
  suggestedDeadline: Date
  userSetDeadline?: Date
  priority: 'high' | 'medium' | 'low'
  notes?: string
  reminderDays: number[]
  isCompleted: boolean
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

interface DeadlineStore {
  deadlines: DocumentDeadline[]
  
  // 期限の取得
  getDeadlinesByUserId: (userId: string) => DocumentDeadline[]
  getDeadlineByDocumentId: (documentId: string) => DocumentDeadline | undefined
  getUpcomingDeadlines: (days?: number) => DocumentDeadline[]
  getOverdueDeadlines: () => DocumentDeadline[]
  
  // 期限の操作
  addDeadline: (deadline: Omit<DocumentDeadline, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateDeadline: (id: string, updates: Partial<DocumentDeadline>) => void
  markDeadlineCompleted: (id: string) => void
  deleteDeadline: (id: string) => void
  
  // 通知関連
  getDeadlinesForReminder: (days: number) => DocumentDeadline[]
}

const useDeadlineStore = create<DeadlineStore>()(
  persist(
    (set, get) => ({
      deadlines: [],

      // 期限の取得
      getDeadlinesByUserId: (userId: string) => {
        return get().deadlines
          .filter(deadline => deadline.userId === userId)
          .sort((a, b) => {
            const aDate = a.userSetDeadline || a.suggestedDeadline
            const bDate = b.userSetDeadline || b.suggestedDeadline
            return new Date(aDate).getTime() - new Date(bDate).getTime()
          })
      },

      getDeadlineByDocumentId: (documentId: string) => {
        return get().deadlines.find(deadline => deadline.documentId === documentId)
      },

      getUpcomingDeadlines: (days = 7) => {
        const now = new Date()
        const futureDate = new Date()
        futureDate.setDate(now.getDate() + days)
        
        return get().deadlines
          .filter(deadline => {
            if (deadline.isCompleted) return false
            
            const targetDate = deadline.userSetDeadline || deadline.suggestedDeadline
            const deadlineDate = new Date(targetDate)
            
            return deadlineDate >= now && deadlineDate <= futureDate
          })
          .sort((a, b) => {
            const aDate = a.userSetDeadline || a.suggestedDeadline
            const bDate = b.userSetDeadline || b.suggestedDeadline
            return new Date(aDate).getTime() - new Date(bDate).getTime()
          })
      },

      getOverdueDeadlines: () => {
        const now = new Date()
        
        return get().deadlines
          .filter(deadline => {
            if (deadline.isCompleted) return false
            
            const targetDate = deadline.userSetDeadline || deadline.suggestedDeadline
            return new Date(targetDate) < now
          })
          .sort((a, b) => {
            const aDate = a.userSetDeadline || a.suggestedDeadline
            const bDate = b.userSetDeadline || b.suggestedDeadline
            return new Date(aDate).getTime() - new Date(bDate).getTime()
          })
      },

      // 期限の操作
      addDeadline: (deadlineData) => {
        const id = crypto.randomUUID()
        const now = new Date()
        
        const newDeadline: DocumentDeadline = {
          ...deadlineData,
          id,
          isCompleted: false,
          createdAt: now,
          updatedAt: now
        }

        set(state => ({
          deadlines: [...state.deadlines, newDeadline]
        }))

        return id
      },

      updateDeadline: (id, updates) => {
        set(state => ({
          deadlines: state.deadlines.map(deadline =>
            deadline.id === id
              ? { ...deadline, ...updates, updatedAt: new Date() }
              : deadline
          )
        }))
      },

      markDeadlineCompleted: (id) => {
        const now = new Date()
        
        set(state => ({
          deadlines: state.deadlines.map(deadline =>
            deadline.id === id
              ? { 
                  ...deadline, 
                  isCompleted: true, 
                  completedAt: now,
                  updatedAt: now 
                }
              : deadline
          )
        }))
      },

      deleteDeadline: (id) => {
        set(state => ({
          deadlines: state.deadlines.filter(deadline => deadline.id !== id)
        }))
      },

      // 通知関連
      getDeadlinesForReminder: (days) => {
        const targetDate = new Date()
        targetDate.setDate(targetDate.getDate() + days)
        
        return get().deadlines
          .filter(deadline => {
            if (deadline.isCompleted) return false
            if (!deadline.reminderDays.includes(days)) return false
            
            const deadlineDate = new Date(deadline.userSetDeadline || deadline.suggestedDeadline)
            const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
            const deadlineDay = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate())
            
            return deadlineDay.getTime() === targetDay.getTime()
          })
      }
    }),
    {
      name: 'mirai-assist-deadlines',
      partialize: (state) => ({ deadlines: state.deadlines })
    }
  )
)

export { useDeadlineStore }
export type { DocumentDeadline }