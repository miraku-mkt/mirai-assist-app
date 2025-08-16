// 利用者情報の型定義
export interface User {
  id: string
  anonymizedName: string // 匿名化された表示名（例：利用者A、利用者B）
  actualName: string // 実際の氏名（暗号化して保存）
  disabilityType: string
  disabilitySupportCategory: string
  supportServiceNumber: string
  municipalityNumber: string
  disabilityWelfareServiceNumber: string // 障害福祉サービス受給者証番号
  regionalConsultationSupportNumber: string // 地域相談支援受給者証番号
  consultantName: string
  planCreator: string
  createdAt: Date
  updatedAt: Date
  // 期限管理用フィールド
  benefitDecisionDate?: Date // 支給決定日
  lastPlanDate?: Date // 最新の計画作成日
  nextMonitoringDate?: Date // 次回モニタリング予定日
  planExpiryDate?: Date // 計画の有効期限
  supportStartDate?: Date // 支援開始日
  
  // 面談管理用フィールド
  nextInterviewId?: string // 次回予定されている面談のID
  lastInterviewDate?: Date // 最終面談実施日
  interviewFrequency?: 'weekly' | 'biweekly' | 'monthly' | 'as_needed' // 面談頻度
}

// サービス等利用計画の型定義
export interface ServicePlan {
  id: string
  userId: string
  planDate: Date
  monitoringPeriod?: string
  userAgreementName: string
  documentType?: 'servicePlan' | 'weeklySchedule' | 'needsAssessment' // 書類タイプを追加
  lifeGoals: string // 利用者及びその家族の生活に対する意向
  comprehensiveSupport: string // 総合的な援助の方針
  longTermGoals: string // 長期目標
  shortTermGoals: string // 短期目標
  services: ServiceDetail[]
  createdAt: Date
  updatedAt: Date
}

// サービス詳細の型定義
export interface ServiceDetail {
  priority?: number
  issueToSolve?: string // 解決すべき課題（本人のニーズ）
  supportGoal?: string // 支援目標
  completionPeriod?: string // 達成時期
  serviceType?: string // 福祉サービス等
  serviceDetails?: string // 種類・内容・量・頻度・時間
  providerName?: string // 提供事業所名（担当者名・電話）
  userRole?: string // 課題解決のための本人の役割
  evaluationPeriod?: string // 評価時期
  otherNotes?: string // その他留意事項
}

// ServicePlanItemエイリアスを追加（互換性のため）
export type ServicePlanItem = ServiceDetail

// 週間計画表の型定義
export interface WeeklySchedule {
  id: string
  userId: string
  startDate: Date
  schedule: DailySchedule[]
  weeklyServices: string // 週単位以外のサービス
  lifeOverview: string // サービス提供によって実現する生活の全体像
  createdAt: Date
  updatedAt: Date
}

// 日別スケジュールの型定義
export interface DailySchedule {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  timeSlots: TimeSlot[]
}

// 時間スロットの型定義
export interface TimeSlot {
  startTime: string // "06:00"形式
  endTime: string
  activity: string
  isService: boolean // サービスかどうか
}

// ニーズ整理票の型定義
export interface NeedsAssessment {
  id: string
  userId: string
  intake: IntakeData
  assessment: AssessmentData
  planning: PlanningData
  createdAt: Date
  updatedAt: Date
}

// インテーク情報の型定義
export interface IntakeData {
  basicInfo: string // 基本情報の整理
  expressedNeeds: string // 本人が表現している希望・解決したい課題
}

// アセスメント情報の型定義
export interface AssessmentData {
  livingConditions: string // 生活的なこと
  psychologicalConditions: string // 心理的なこと
  socialConditions: string // 社会性・対人関係の特徴
}

// プランニング情報の型定義
export interface PlanningData {
  supportGoals: string // 支援目標
  supportMethods: string // 対応・方針
}

// モニタリング報告書の型定義
export interface MonitoringReport {
  id: string
  userId: string
  reportDate: Date
  monitoringDate: Date
  userAgreementName: string
  comprehensiveSupport: string // 総合的な援助の方針
  overallStatus: string // 全体の状況
  monitoringItems: MonitoringItem[]
  createdAt: Date
  updatedAt: Date
}

// モニタリング項目の型定義
export interface MonitoringItem {
  priority: number
  supportGoal: string // 支援目標
  completionPeriod: string // 達成時期
  serviceStatus: string // サービス提供状況（事業者からの聞き取り）
  userSatisfaction: string // 本人の感想・満足度
  goalAchievement: string // 支援目標の達成度（ニーズの充足度）
  currentIssues: string // 今後の課題・解決方法
  planChanges: {
    serviceChange: boolean // サービス事業の変更
    serviceContent: boolean // サービスの変更
    planModification: boolean // 連携計画の変更
  }
  otherNotes: string // その他留意事項
}

// 面談記録の型定義
export interface InterviewRecord {
  id: string
  userId: string
  recordDate: Date
  recordType: 'audio' | 'text' | 'image'
  content: string // テキスト内容または音声の文字起こし結果
  fileName?: string // ファイル名（音声・画像の場合）
  filePath?: string // ファイルパス（音声・画像の場合）
  createdAt: Date
}

// AI生成結果の型定義
export interface AIGenerationResult {
  documentType: 'servicePlan' | 'weeklySchedule' | 'needsAssessment' | 'monitoringReport'
  content: any // 各ドキュメントタイプに応じたデータ
  confidence: number // 生成結果の信頼度（0-1）
  generatedAt: Date
}

// アプリケーション設定の型定義
export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'medium' | 'large'
  highContrast: boolean
  autoSave: boolean
  backupPath: string
  encryptionEnabled: boolean
}

// 認証の型定義
export interface AuthState {
  isAuthenticated: boolean
  pin: string
  lastAuthTime: Date | null
}

// タスク管理の型定義
export interface Task {
  id: string
  userId: string
  type: 'plan_creation' | 'plan_update' | 'monitoring' | 'document_review' | 'follow_up'
  title: string
  description: string
  dueDate: Date
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  documentType?: 'servicePlan' | 'weeklySchedule' | 'needsAssessment' | 'monitoringReport'
  documentId?: string
  createdAt: Date
  completedAt?: Date
}

// ダッシュボード統計の型定義
export interface DashboardStats {
  totalUsers: number
  overdueUsers: number
  todayTasks: number
  weeklyTasks: number
  documentsCreatedToday: number
  documentsCreatedThisWeek: number
  upcomingDeadlines: number
}

// 進捗ステータスの型定義
export interface UserProgress {
  userId: string
  documentsStatus: {
    servicePlan: 'not_started' | 'in_progress' | 'completed' | 'needs_update'
    weeklySchedule: 'not_started' | 'in_progress' | 'completed' | 'needs_update'
    needsAssessment: 'not_started' | 'in_progress' | 'completed' | 'needs_update'
    monitoringReport: 'not_started' | 'in_progress' | 'completed' | 'needs_update'
  }
  nextAction: string
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent'
  lastActivity: Date
}

// 面談記録の型定義（新規追加）
export interface InterviewSession {
  id: string
  userId: string
  scheduledDate: Date
  endDate: Date // 面談終了時間
  actualDate?: Date // 実際に実施した日時
  location: string
  purpose: string // 面談の目的（初回面談、モニタリング、緊急対応など）
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
  participants: string[] // 参加者（利用者、家族、関係者など）
  notes?: string // 面談メモ・記録
  nextActionItems?: string[] // 次回までのアクション項目
  nextInterviewDate?: Date // 次回面談予定日
  documentReferences?: string[] // 関連する書類ID
  createdAt: Date
  updatedAt: Date
}