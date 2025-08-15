import * as XLSX from 'xlsx'
import { ServicePlan, MonitoringReport } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

// サービス等利用計画のExcel出力
export const exportServicePlanToExcel = (plan: ServicePlan, userName: string, userInfo: any) => {
  // ワークブック作成
  const wb = XLSX.utils.book_new()

  // 基本情報シート
  const basicInfo = [
    ['サービス等利用計画（様式2-1）'],
    [''],
    ['作成日', format(plan.createdAt, 'yyyy年M月d日', { locale: ja })],
    ['利用者氏名', plan.userAgreementName],
    ['障害種別', userInfo?.disabilityType || ''],
    ['障害支援区分', userInfo?.disabilitySupportCategory || ''],
    [''],
    ['利用者及びその家族の生活に対する意向'],
    [plan.lifeGoals],
    [''],
    ['総合的な援助の方針'],
    [plan.comprehensiveSupport],
    [''],
    ['長期目標'],
    [plan.longTermGoals],
    [''],
    ['短期目標'],
    [plan.shortTermGoals]
  ]

  const ws1 = XLSX.utils.aoa_to_sheet(basicInfo)
  
  // 列幅を設定
  ws1['!cols'] = [
    { width: 20 },
    { width: 60 }
  ]

  // サービス詳細シート
  const serviceHeaders = [
    ['福祉サービス等'],
    [''],
    ['優先順位', '解決すべき課題', '支援目標', '達成時期', 'サービス内容・量', '提供事業所名', '本人の役割', '評価時期', 'その他留意事項']
  ]

  const serviceData = plan.services.map(service => [
    service.priority,
    service.issueToSolve,
    service.supportGoal,
    service.completionPeriod,
    service.serviceDetails,
    service.providerName,
    service.userRole,
    service.evaluationPeriod,
    service.otherNotes
  ])

  const ws2 = XLSX.utils.aoa_to_sheet([...serviceHeaders, ...serviceData])
  
  // 列幅を設定
  ws2['!cols'] = [
    { width: 8 },   // 優先順位
    { width: 25 },  // 解決すべき課題
    { width: 25 },  // 支援目標
    { width: 12 },  // 達成時期
    { width: 30 },  // サービス内容・量
    { width: 20 },  // 提供事業所名
    { width: 20 },  // 本人の役割
    { width: 12 },  // 評価時期
    { width: 25 }   // その他留意事項
  ]

  // シートをワークブックに追加
  XLSX.utils.book_append_sheet(wb, ws1, '基本情報')
  XLSX.utils.book_append_sheet(wb, ws2, 'サービス詳細')

  // ファイルをダウンロード
  const fileName = `サービス等利用計画_${userName}_${format(plan.createdAt, 'yyyyMMdd', { locale: ja })}.xlsx`
  XLSX.writeFile(wb, fileName)
}

// モニタリング報告書のExcel出力
export const exportMonitoringReportToExcel = (report: MonitoringReport, userName: string, userInfo: any) => {
  // ワークブック作成
  const wb = XLSX.utils.book_new()

  // 基本情報シート
  const basicInfo = [
    ['モニタリング報告書（様式3-1）'],
    [''],
    ['作成日', format(report.createdAt, 'yyyy年M月d日', { locale: ja })],
    ['モニタリング実施日', format(report.monitoringDate, 'yyyy年M月d日', { locale: ja })],
    ['利用者氏名', report.userAgreementName],
    ['障害種別', userInfo?.disabilityType || ''],
    ['障害支援区分', userInfo?.disabilitySupportCategory || ''],
    [''],
    ['総合的な援助の方針'],
    [report.comprehensiveSupport],
    [''],
    ['全体の状況'],
    [report.overallStatus]
  ]

  const ws1 = XLSX.utils.aoa_to_sheet(basicInfo)
  
  // 列幅を設定
  ws1['!cols'] = [
    { width: 20 },
    { width: 60 }
  ]

  // モニタリング項目シート
  const monitoringHeaders = [
    ['モニタリング項目'],
    [''],
    ['優先順位', '支援目標', '達成時期', 'サービス提供状況', '本人の感想・満足度', '支援目標の達成度', '今後の課題・解決方法', 'その他留意事項']
  ]

  const monitoringData = report.monitoringItems.map(item => [
    item.priority,
    item.supportGoal,
    item.completionPeriod,
    item.serviceStatus,
    item.userSatisfaction,
    item.goalAchievement,
    item.currentIssues,
    item.otherNotes
  ])

  const ws2 = XLSX.utils.aoa_to_sheet([...monitoringHeaders, ...monitoringData])
  
  // 列幅を設定
  ws2['!cols'] = [
    { width: 8 },   // 優先順位
    { width: 25 },  // 支援目標
    { width: 12 },  // 達成時期
    { width: 30 },  // サービス提供状況
    { width: 30 },  // 本人の感想・満足度
    { width: 25 },  // 支援目標の達成度
    { width: 30 },  // 今後の課題・解決方法
    { width: 25 }   // その他留意事項
  ]

  // シートをワークブックに追加
  XLSX.utils.book_append_sheet(wb, ws1, '基本情報')
  XLSX.utils.book_append_sheet(wb, ws2, 'モニタリング項目')

  // ファイルをダウンロード
  const fileName = `モニタリング報告書_${userName}_${format(report.createdAt, 'yyyyMMdd', { locale: ja })}.xlsx`
  XLSX.writeFile(wb, fileName)
}

// 週間計画表のExcel出力（将来の拡張用）
export const exportWeeklyScheduleToExcel = (schedule: any, userName: string) => {
  // 実装予定
  console.log('週間計画表のExcel出力は今後実装予定です')
}

// ニーズ整理票のExcel出力（将来の拡張用）
export const exportNeedsAssessmentToExcel = (assessment: any, userName: string) => {
  // 実装予定
  console.log('ニーズ整理票のExcel出力は今後実装予定です')
}