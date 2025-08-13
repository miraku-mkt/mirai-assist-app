import * as ExcelJS from 'exceljs'
import { ServicePlan, WeeklySchedule, NeedsAssessment, MonitoringReport, User } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

// サービス等利用計画をExcelに出力
export const exportServicePlanToExcel = async (
  servicePlan: ServicePlan,
  user: User
): Promise<void> => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('サービス等利用計画')

  // ヘッダー部分の設定
  worksheet.mergeCells('A1:I1')
  const titleCell = worksheet.getCell('A1')
  titleCell.value = 'サービス等利用計画・障害児支援利用計画'
  titleCell.font = { size: 16, bold: true }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  
  // 様式番号
  worksheet.getCell('J1').value = '様式2-1'
  worksheet.getCell('J1').font = { bold: true }
  worksheet.getCell('J1').alignment = { horizontal: 'center' }

  // 基本情報の設定
  let row = 3
  worksheet.getCell(`A${row}`).value = '利用者氏名（児童氏名）'
  worksheet.getCell(`B${row}`).value = user.actualName
  worksheet.getCell(`C${row}`).value = '障害支援区分'
  worksheet.getCell(`D${row}`).value = user.disabilitySupportCategory
  worksheet.getCell(`E${row}`).value = '相談支援事業者名'
  worksheet.getCell(`F${row}`).value = user.consultantName

  row++
  worksheet.getCell(`A${row}`).value = '障害福祉サービス受給者証番号'
  worksheet.getCell(`B${row}`).value = user.supportServiceNumber
  worksheet.getCell(`C${row}`).value = '利用者負担上限額'
  worksheet.getCell(`D${row}`).value = ''
  worksheet.getCell(`E${row}`).value = '計画作成担当者'
  worksheet.getCell(`F${row}`).value = user.planCreator

  row++
  worksheet.getCell(`A${row}`).value = '地域相談支援受給者証番号'
  worksheet.getCell(`B${row}`).value = ''
  worksheet.getCell(`C${row}`).value = '通所受給者証番号'
  worksheet.getCell(`D${row}`).value = user.municipalityNumber

  row++
  worksheet.getCell(`A${row}`).value = '計画作成日'
  worksheet.getCell(`B${row}`).value = format(servicePlan.planDate, 'yyyy年MM月dd日', { locale: ja })
  worksheet.getCell(`C${row}`).value = 'モニタリング期間（開始年月）'
  worksheet.getCell(`D${row}`).value = servicePlan.monitoringPeriod
  worksheet.getCell(`E${row}`).value = '利用者同意者名欄'
  worksheet.getCell(`F${row}`).value = servicePlan.userAgreementName

  // 意向・方針・目標
  row += 2
  worksheet.mergeCells(`A${row}:I${row}`)
  worksheet.getCell(`A${row}`).value = '利用者及びその家族の生活に対する意向（希望する生活）'
  worksheet.getCell(`A${row}`).font = { bold: true }
  worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } }

  row++
  worksheet.mergeCells(`A${row}:I${row + 2}`)
  worksheet.getCell(`A${row}`).value = servicePlan.lifeGoals
  worksheet.getCell(`A${row}`).alignment = { horizontal: 'left', vertical: 'top', wrapText: true }

  row += 3
  worksheet.mergeCells(`A${row}:I${row}`)
  worksheet.getCell(`A${row}`).value = '総合的な援助の方針'
  worksheet.getCell(`A${row}`).font = { bold: true }
  worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } }

  row++
  worksheet.mergeCells(`A${row}:I${row + 1}`)
  worksheet.getCell(`A${row}`).value = servicePlan.comprehensiveSupport
  worksheet.getCell(`A${row}`).alignment = { horizontal: 'left', vertical: 'top', wrapText: true }

  row += 2
  worksheet.getCell(`A${row}`).value = '長期目標'
  worksheet.getCell(`A${row}`).font = { bold: true }
  worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } }
  worksheet.mergeCells(`A${row}:I${row}`)

  row++
  worksheet.mergeCells(`A${row}:I${row}`)
  worksheet.getCell(`A${row}`).value = servicePlan.longTermGoals
  worksheet.getCell(`A${row}`).alignment = { horizontal: 'left', vertical: 'top', wrapText: true }

  row++
  worksheet.getCell(`A${row}`).value = '短期目標'
  worksheet.getCell(`A${row}`).font = { bold: true }
  worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } }
  worksheet.mergeCells(`A${row}:I${row}`)

  row++
  worksheet.mergeCells(`A${row}:I${row}`)
  worksheet.getCell(`A${row}`).value = servicePlan.shortTermGoals
  worksheet.getCell(`A${row}`).alignment = { horizontal: 'left', vertical: 'top', wrapText: true }

  // サービス詳細のテーブルヘッダー
  row += 2
  const headers = [
    '優先順位',
    '解決すべき課題（本人のニーズ）',
    '支援目標',
    '達成時期',
    '福祉サービス等',
    '種類・内容・量・頻度・時間',
    '提供事業所名（担当者名・電話）',
    '課題解決のための本人の役割',
    '評価時期',
    'その他留意事項'
  ]

  headers.forEach((header, index) => {
    const cell = worksheet.getCell(row, index + 1)
    cell.value = header
    cell.font = { bold: true }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  })

  // サービス詳細データ
  servicePlan.services.forEach((service) => {
    row++
    const serviceData = [
      service.priority,
      service.issueToSolve,
      service.supportGoal,
      service.completionPeriod,
      service.serviceType,
      service.serviceDetails,
      service.providerName,
      service.userRole,
      service.evaluationPeriod,
      service.otherNotes
    ]

    serviceData.forEach((data, index) => {
      const cell = worksheet.getCell(row, index + 1)
      cell.value = data
      cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })
  })

  // 列幅の調整
  worksheet.columns = [
    { width: 8 },   // 優先順位
    { width: 20 },  // 解決すべき課題
    { width: 20 },  // 支援目標
    { width: 12 },  // 達成時期
    { width: 15 },  // 福祉サービス等
    { width: 25 },  // 種類・内容等
    { width: 20 },  // 提供事業所名
    { width: 20 },  // 本人の役割
    { width: 12 },  // 評価時期
    { width: 20 }   // その他留意事項
  ]

  // ファイルのダウンロード
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `サービス等利用計画_${user.actualName}_${format(new Date(), 'yyyyMMdd')}.xlsx`
  a.click()
  window.URL.revokeObjectURL(url)
}

// 週間計画表をExcelに出力
export const exportWeeklyScheduleToExcel = async (
  weeklySchedule: WeeklySchedule,
  user: User
): Promise<void> => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('週間計画表')

  // ヘッダー設定
  worksheet.mergeCells('A1:I1')
  const titleCell = worksheet.getCell('A1')
  titleCell.value = 'サービス等利用計画・障害児支援利用計画【週間計画表】'
  titleCell.font = { size: 16, bold: true }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }

  // 様式番号
  worksheet.getCell('J1').value = '様式2-2'
  worksheet.getCell('J1').font = { bold: true }
  worksheet.getCell('J1').alignment = { horizontal: 'center' }

  // 基本情報
  let row = 3
  worksheet.getCell(`A${row}`).value = '利用者氏名（児童氏名）'
  worksheet.getCell(`B${row}`).value = user.actualName
  worksheet.getCell(`C${row}`).value = '障害支援区分'
  worksheet.getCell(`D${row}`).value = user.disabilitySupportCategory
  worksheet.getCell(`E${row}`).value = '相談支援事業者名'
  worksheet.getCell(`F${row}`).value = user.consultantName

  row++
  worksheet.getCell(`A${row}`).value = '計画開始年月'
  worksheet.getCell(`B${row}`).value = format(weeklySchedule.startDate, 'yyyy年MM月', { locale: ja })

  // 曜日ヘッダー
  row += 2
  const dayHeaders = ['時間', '月', '火', '水', '木', '金', '土', '日・祝', '土日祝日常生活上の活動']
  dayHeaders.forEach((header, index) => {
    const cell = worksheet.getCell(row, index + 1)
    cell.value = header
    cell.font = { bold: true }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  })

  // 時間帯の設定（6:00-22:00、0:00-4:00）
  const timeSlots = []
  for (let hour = 6; hour <= 22; hour += 2) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`)
  }
  for (let hour = 0; hour <= 4; hour += 2) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`)
  }

  // スケジュールデータの入力
  timeSlots.forEach((time) => {
    row++
    worksheet.getCell(row, 1).value = time
    worksheet.getCell(row, 1).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(row, 1).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }

    // 各曜日の列に枠線を追加
    for (let col = 2; col <= 9; col++) {
      const cell = worksheet.getCell(row, col)
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    }
  })

  // 週単位以外のサービス
  row += 2
  worksheet.getCell(`A${row}`).value = '週単位以外のサービス'
  worksheet.getCell(`A${row}`).font = { bold: true }
  worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } }
  
  row++
  worksheet.mergeCells(`A${row}:I${row + 2}`)
  worksheet.getCell(`A${row}`).value = weeklySchedule.weeklyServices
  worksheet.getCell(`A${row}`).alignment = { horizontal: 'left', vertical: 'top', wrapText: true }

  // サービス提供によって実現する生活の全体像
  row += 3
  worksheet.getCell(`A${row}`).value = 'サービス提供によって実現する生活の全体像'
  worksheet.getCell(`A${row}`).font = { bold: true }
  worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } }
  
  row++
  worksheet.mergeCells(`A${row}:I${row + 2}`)
  worksheet.getCell(`A${row}`).value = weeklySchedule.lifeOverview
  worksheet.getCell(`A${row}`).alignment = { horizontal: 'left', vertical: 'top', wrapText: true }

  // 列幅調整
  worksheet.columns = [
    { width: 8 },   // 時間
    { width: 15 },  // 月
    { width: 15 },  // 火
    { width: 15 },  // 水
    { width: 15 },  // 木
    { width: 15 },  // 金
    { width: 15 },  // 土
    { width: 15 },  // 日・祝
    { width: 25 }   // 土日祝日常生活上の活動
  ]

  // ファイルダウンロード
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `週間計画表_${user.actualName}_${format(new Date(), 'yyyyMMdd')}.xlsx`
  a.click()
  window.URL.revokeObjectURL(url)
}

// ニーズ整理票をExcelに出力
export const exportNeedsAssessmentToExcel = async (
  needsAssessment: NeedsAssessment,
  user: User
): Promise<void> => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('ニーズ整理票')

  worksheet.mergeCells('A1:E1')
  const titleCell = worksheet.getCell('A1')
  titleCell.value = 'ニーズ整理票'
  titleCell.font = { size: 16, bold: true }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }

  // セクションヘッダー
  let row = 3
  const sectionHeaders = ['インテーク', 'アセスメント', 'プランニング']
  let col = 1

  sectionHeaders.forEach((header, index) => {
    const cell = worksheet.getCell(row, col + index * 2)
    cell.value = header
    cell.font = { size: 14, bold: true }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })

  // 内容の入力
  row++
  
  // インテーク
  worksheet.getCell(row, 1).value = '情報の整理'
  worksheet.getCell(row, 1).font = { bold: true }
  row++
  worksheet.mergeCells(`A${row}:B${row + 5}`)
  worksheet.getCell(row, 1).value = needsAssessment.intake.basicInfo
  worksheet.getCell(row, 1).alignment = { horizontal: 'left', vertical: 'top', wrapText: true }

  // アセスメント
  let assessmentRow = 4
  worksheet.getCell(assessmentRow, 3).value = '環境・解釈・反応'
  worksheet.getCell(assessmentRow, 3).font = { bold: true }
  assessmentRow++
  worksheet.mergeCells(`C${assessmentRow}:D${assessmentRow + 5}`)
  const assessmentText = `生活的なこと: ${needsAssessment.assessment.livingConditions}\n\n心理的なこと: ${needsAssessment.assessment.psychologicalConditions}\n\n社会性・対人関係の特徴: ${needsAssessment.assessment.socialConditions}`
  worksheet.getCell(assessmentRow, 3).value = assessmentText
  worksheet.getCell(assessmentRow, 3).alignment = { horizontal: 'left', vertical: 'top', wrapText: true }

  // プランニング
  let planningRow = 4
  worksheet.getCell(planningRow, 5).value = '支援目標'
  worksheet.getCell(planningRow, 5).font = { bold: true }
  planningRow++
  worksheet.mergeCells(`E${planningRow}:E${planningRow + 5}`)
  const planningText = `支援目標: ${needsAssessment.planning.supportGoals}\n\n対応・方針: ${needsAssessment.planning.supportMethods}`
  worksheet.getCell(planningRow, 5).value = planningText
  worksheet.getCell(planningRow, 5).alignment = { horizontal: 'left', vertical: 'top', wrapText: true }

  // 列幅調整
  worksheet.columns = [
    { width: 25 },
    { width: 25 },
    { width: 25 },
    { width: 25 },
    { width: 25 }
  ]

  // ファイルダウンロード
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ニーズ整理票_${user.actualName}_${format(new Date(), 'yyyyMMdd')}.xlsx`
  a.click()
  window.URL.revokeObjectURL(url)
}

// モニタリング報告書をExcelに出力
export const exportMonitoringReportToExcel = async (
  monitoringReport: MonitoringReport,
  user: User
): Promise<void> => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('モニタリング報告書')

  // ヘッダー設定
  worksheet.mergeCells('A1:J1')
  const titleCell = worksheet.getCell('A1')
  titleCell.value = 'モニタリング報告書（継続サービス利用支援・継続障害児支援利用援助）'
  titleCell.font = { size: 16, bold: true }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }

  // 様式番号
  worksheet.getCell('K1').value = '様式3-1'
  worksheet.getCell('K1').font = { bold: true }
  worksheet.getCell('K1').alignment = { horizontal: 'center' }

  // 基本情報
  let row = 3
  worksheet.getCell(`A${row}`).value = '利用者氏名（児童氏名）'
  worksheet.getCell(`B${row}`).value = user.actualName
  worksheet.getCell(`C${row}`).value = '障害支援区分'
  worksheet.getCell(`D${row}`).value = user.disabilitySupportCategory
  worksheet.getCell(`E${row}`).value = '相談支援事業者名'
  worksheet.getCell(`F${row}`).value = user.consultantName

  row++
  worksheet.getCell(`A${row}`).value = '計画作成日'
  worksheet.getCell(`B${row}`).value = format(monitoringReport.reportDate, 'yyyy年MM月dd日', { locale: ja })
  worksheet.getCell(`C${row}`).value = 'モニタリング実施日'
  worksheet.getCell(`D${row}`).value = format(monitoringReport.monitoringDate, 'yyyy年MM月dd日', { locale: ja })
  worksheet.getCell(`E${row}`).value = '利用者同意者名欄'
  worksheet.getCell(`F${row}`).value = monitoringReport.userAgreementName

  // 方針と状況
  row += 2
  worksheet.mergeCells(`A${row}:E${row}`)
  worksheet.getCell(`A${row}`).value = '総合的な援助の方針'
  worksheet.getCell(`A${row}`).font = { bold: true }
  worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } }
  
  worksheet.mergeCells(`F${row}:J${row}`)
  worksheet.getCell(`F${row}`).value = '全体の状況'
  worksheet.getCell(`F${row}`).font = { bold: true }
  worksheet.getCell(`F${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } }

  row++
  worksheet.mergeCells(`A${row}:E${row + 2}`)
  worksheet.getCell(`A${row}`).value = monitoringReport.comprehensiveSupport
  worksheet.getCell(`A${row}`).alignment = { horizontal: 'left', vertical: 'top', wrapText: true }

  worksheet.mergeCells(`F${row}:J${row + 2}`)
  worksheet.getCell(`F${row}`).value = monitoringReport.overallStatus
  worksheet.getCell(`F${row}`).alignment = { horizontal: 'left', vertical: 'top', wrapText: true }

  // モニタリングテーブル
  row += 4
  const monitoringHeaders = [
    '優先順位',
    '支援目標',
    '達成時期',
    'サービス提供状況',
    '本人の感想・満足度',
    '支援目標の達成度',
    '今後の課題・解決方法',
    '計画変更の必要性',
    'その他留意事項'
  ]

  monitoringHeaders.forEach((header, index) => {
    const cell = worksheet.getCell(row, index + 1)
    cell.value = header
    cell.font = { bold: true }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  })

  // モニタリングデータ
  monitoringReport.monitoringItems.forEach((item) => {
    row++
    const itemData = [
      item.priority,
      item.supportGoal,
      item.completionPeriod,
      item.serviceStatus,
      item.userSatisfaction,
      item.goalAchievement,
      item.currentIssues,
      `サービス事業: ${item.planChanges.serviceChange ? '有' : '無'}\nサービス内容: ${item.planChanges.serviceContent ? '有' : '無'}\n連携計画: ${item.planChanges.planModification ? '有' : '無'}`,
      item.otherNotes
    ]

    itemData.forEach((data, index) => {
      const cell = worksheet.getCell(row, index + 1)
      cell.value = data
      cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })
  })

  // 列幅調整
  worksheet.columns = [
    { width: 8 },   // 優先順位
    { width: 20 },  // 支援目標
    { width: 12 },  // 達成時期
    { width: 20 },  // サービス提供状況
    { width: 20 },  // 本人の感想
    { width: 20 },  // 達成度
    { width: 25 },  // 今後の課題
    { width: 15 },  // 計画変更
    { width: 20 }   // その他留意事項
  ]

  // ファイルダウンロード
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `モニタリング報告書_${user.actualName}_${format(new Date(), 'yyyyMMdd')}.xlsx`
  a.click()
  window.URL.revokeObjectURL(url)
}