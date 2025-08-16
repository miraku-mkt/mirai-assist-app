import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  ServicePlan, 
  WeeklySchedule, 
  NeedsAssessment, 
  MonitoringReport, 
  InterviewRecord 
} from '@/types'

interface DocumentState {
  servicePlans: ServicePlan[]
  weeklySchedules: WeeklySchedule[]
  needsAssessments: NeedsAssessment[]
  monitoringReports: MonitoringReport[]
  interviewRecords: InterviewRecord[]
  
  // Service Plan methods
  addServicePlan: (plan: Omit<ServicePlan, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateServicePlan: (id: string, updates: Partial<ServicePlan>) => void
  deleteServicePlan: (id: string) => void
  getServicePlansByUserId: (userId: string) => ServicePlan[]
  getServicePlanById: (id: string) => ServicePlan | undefined
  
  // Weekly Schedule methods
  addWeeklySchedule: (schedule: Omit<WeeklySchedule, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateWeeklySchedule: (id: string, updates: Partial<WeeklySchedule>) => void
  deleteWeeklySchedule: (id: string) => void
  getWeeklySchedulesByUserId: (userId: string) => WeeklySchedule[]
  
  // Needs Assessment methods
  addNeedsAssessment: (assessment: Omit<NeedsAssessment, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateNeedsAssessment: (id: string, updates: Partial<NeedsAssessment>) => void
  deleteNeedsAssessment: (id: string) => void
  getNeedsAssessmentsByUserId: (userId: string) => NeedsAssessment[]
  
  // Monitoring Report methods
  addMonitoringReport: (report: Omit<MonitoringReport, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateMonitoringReport: (id: string, updates: Partial<MonitoringReport>) => void
  deleteMonitoringReport: (id: string) => void
  getMonitoringReportsByUserId: (userId: string) => MonitoringReport[]
  
  // Interview Record methods
  addInterviewRecord: (record: Omit<InterviewRecord, 'id' | 'createdAt'>) => void
  updateInterviewRecord: (id: string, updates: Partial<InterviewRecord>) => void
  deleteInterviewRecord: (id: string) => void
  getInterviewRecordsByUserId: (userId: string) => InterviewRecord[]
  
  // Universal document retrieval methods
  getDocumentById: (id: string) => ServicePlan | WeeklySchedule | NeedsAssessment | undefined
  
  // Clear methods
  clearUserDocuments: (userId: string) => void
  clearAllDocuments: () => void
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      servicePlans: [],
      weeklySchedules: [],
      needsAssessments: [],
      monitoringReports: [],
      interviewRecords: [],

      // Service Plan methods
      addServicePlan: (planData) => {
        const now = new Date()
        const newPlan: ServicePlan = {
          ...planData,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now
        }

        set((state) => ({
          servicePlans: [...state.servicePlans, newPlan]
        }))
      },

      updateServicePlan: (id, updates) => {
        set((state) => ({
          servicePlans: state.servicePlans.map((plan) =>
            plan.id === id
              ? { ...plan, ...updates, updatedAt: new Date() }
              : plan
          )
        }))
      },

      deleteServicePlan: (id) => {
        set((state) => ({
          servicePlans: state.servicePlans.filter((plan) => plan.id !== id)
        }))
      },

      getServicePlansByUserId: (userId) => {
        return get().servicePlans.filter((plan) => plan.userId === userId)
      },

      getServicePlanById: (id) => {
        return get().servicePlans.find((plan) => plan.id === id)
      },

      // Weekly Schedule methods
      addWeeklySchedule: (scheduleData) => {
        const now = new Date()
        const newSchedule: WeeklySchedule = {
          ...scheduleData,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now
        }

        set((state) => ({
          weeklySchedules: [...state.weeklySchedules, newSchedule]
        }))
      },

      updateWeeklySchedule: (id, updates) => {
        set((state) => ({
          weeklySchedules: state.weeklySchedules.map((schedule) =>
            schedule.id === id
              ? { ...schedule, ...updates, updatedAt: new Date() }
              : schedule
          )
        }))
      },

      deleteWeeklySchedule: (id) => {
        set((state) => ({
          weeklySchedules: state.weeklySchedules.filter((schedule) => schedule.id !== id)
        }))
      },

      getWeeklySchedulesByUserId: (userId) => {
        return get().weeklySchedules.filter((schedule) => schedule.userId === userId)
      },

      // Needs Assessment methods
      addNeedsAssessment: (assessmentData) => {
        const now = new Date()
        const newAssessment: NeedsAssessment = {
          ...assessmentData,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now
        }

        set((state) => ({
          needsAssessments: [...state.needsAssessments, newAssessment]
        }))
      },

      updateNeedsAssessment: (id, updates) => {
        set((state) => ({
          needsAssessments: state.needsAssessments.map((assessment) =>
            assessment.id === id
              ? { ...assessment, ...updates, updatedAt: new Date() }
              : assessment
          )
        }))
      },

      deleteNeedsAssessment: (id) => {
        set((state) => ({
          needsAssessments: state.needsAssessments.filter((assessment) => assessment.id !== id)
        }))
      },

      getNeedsAssessmentsByUserId: (userId) => {
        return get().needsAssessments.filter((assessment) => assessment.userId === userId)
      },

      // Monitoring Report methods
      addMonitoringReport: (reportData) => {
        const now = new Date()
        const newReport: MonitoringReport = {
          ...reportData,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now
        }

        set((state) => ({
          monitoringReports: [...state.monitoringReports, newReport]
        }))
      },

      updateMonitoringReport: (id, updates) => {
        set((state) => ({
          monitoringReports: state.monitoringReports.map((report) =>
            report.id === id
              ? { ...report, ...updates, updatedAt: new Date() }
              : report
          )
        }))
      },

      deleteMonitoringReport: (id) => {
        set((state) => ({
          monitoringReports: state.monitoringReports.filter((report) => report.id !== id)
        }))
      },

      getMonitoringReportsByUserId: (userId) => {
        return get().monitoringReports.filter((report) => report.userId === userId)
      },

      // Interview Record methods
      addInterviewRecord: (recordData) => {
        const newRecord: InterviewRecord = {
          ...recordData,
          id: crypto.randomUUID(),
          createdAt: new Date()
        }

        set((state) => ({
          interviewRecords: [...state.interviewRecords, newRecord]
        }))
      },

      updateInterviewRecord: (id, updates) => {
        set((state) => ({
          interviewRecords: state.interviewRecords.map((record) =>
            record.id === id
              ? { ...record, ...updates }
              : record
          )
        }))
      },

      deleteInterviewRecord: (id) => {
        set((state) => ({
          interviewRecords: state.interviewRecords.filter((record) => record.id !== id)
        }))
      },

      getInterviewRecordsByUserId: (userId) => {
        return get().interviewRecords.filter((record) => record.userId === userId)
      },

      // Universal document retrieval methods
      getDocumentById: (id) => {
        const state = get()
        
        // Check service plans first
        const servicePlan = state.servicePlans.find((plan) => plan.id === id)
        if (servicePlan) return servicePlan
        
        // Check weekly schedules
        const weeklySchedule = state.weeklySchedules.find((schedule) => schedule.id === id)
        if (weeklySchedule) return weeklySchedule
        
        // Check needs assessments
        const needsAssessment = state.needsAssessments.find((assessment) => assessment.id === id)
        if (needsAssessment) return needsAssessment
        
        return undefined
      },

      // Clear methods
      clearUserDocuments: (userId) => {
        set((state) => ({
          servicePlans: state.servicePlans.filter((plan) => plan.userId !== userId),
          weeklySchedules: state.weeklySchedules.filter((schedule) => schedule.userId !== userId),
          needsAssessments: state.needsAssessments.filter((assessment) => assessment.userId !== userId),
          monitoringReports: state.monitoringReports.filter((report) => report.userId !== userId),
          interviewRecords: state.interviewRecords.filter((record) => record.userId !== userId)
        }))
      },

      clearAllDocuments: () => {
        set({
          servicePlans: [],
          weeklySchedules: [],
          needsAssessments: [],
          monitoringReports: [],
          interviewRecords: []
        })
      }
    }),
    {
      name: 'mirai-assist-documents'
    }
  )
)