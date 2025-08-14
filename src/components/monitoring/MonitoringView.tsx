import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
  FileText,
  Calendar,
  User,
  CheckSquare,
  Plus,
  Eye
} from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { useDocumentStore } from '@/stores/documentStore'
import { MonitoringReport } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

const MonitoringView: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { getUserById } = useUserStore()
  const { getMonitoringReportsByUserId } = useDocumentStore()
  
  const [reports, setReports] = useState<MonitoringReport[]>([])
  const [selectedReport, setSelectedReport] = useState<MonitoringReport | null>(null)

  const user = userId ? getUserById(userId) : null

  useEffect(() => {
    if (userId) {
      const userReports = getMonitoringReportsByUserId(userId)
      setReports(userReports)
    }
  }, [userId, getMonitoringReportsByUserId])

  const handleBack = () => {
    navigate('/monitoring')
  }

  const handleCreateNew = () => {
    navigate(`/monitoring/create/${userId}`)
  }

  const handleViewReport = (report: MonitoringReport) => {
    setSelectedReport(report)
  }

  const handleCloseDetail = () => {
    setSelectedReport(null)
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">利用者が見つかりません</h2>
          <button onClick={handleBack} className="btn-secondary">
            戻る
          </button>
        </div>
      </div>
    )
  }

  if (selectedReport) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 詳細表示ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCloseDetail}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">モニタリング報告書</h1>
              <p className="text-gray-600 mt-1">
                {user.actualName}さん - {format(new Date(selectedReport.reportDate), 'yyyy年M月d日', { locale: ja })}作成
              </p>
            </div>
          </div>
        </div>

        {/* 報告書詳細 */}
        <div className="card">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              基本情報
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">報告書作成日</label>
                <div className="text-gray-900">
                  {format(new Date(selectedReport.reportDate), 'yyyy年M月d日', { locale: ja })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">モニタリング実施日</label>
                <div className="text-gray-900">
                  {format(new Date(selectedReport.monitoringDate), 'yyyy年M月d日', { locale: ja })}
                </div>
              </div>
            </div>

            {selectedReport.comprehensiveSupport && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">総合的な援助の方針</label>
                <div className="bg-gray-50 rounded-lg p-4 text-gray-900">
                  {selectedReport.comprehensiveSupport}
                </div>
              </div>
            )}

            {selectedReport.overallStatus && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">全体の状況</label>
                <div className="bg-gray-50 rounded-lg p-4 text-gray-900">
                  {selectedReport.overallStatus}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* モニタリング項目 */}
        <div className="card">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CheckSquare className="w-5 h-5 mr-2" />
              モニタリング項目
            </h2>

            <div className="space-y-6">
              {selectedReport.monitoringItems.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">項目 {index + 1}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">支援目標</label>
                      <div className="text-gray-900">{item.supportGoal}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">達成時期</label>
                      <div className="text-gray-900">{item.completionPeriod || '-'}</div>
                    </div>
                  </div>

                  {item.serviceStatus && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">サービス提供状況</label>
                      <div className="bg-gray-50 rounded-lg p-3 text-gray-900">{item.serviceStatus}</div>
                    </div>
                  )}

                  {item.userSatisfaction && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">本人の感想・満足度</label>
                      <div className="bg-gray-50 rounded-lg p-3 text-gray-900">{item.userSatisfaction}</div>
                    </div>
                  )}

                  {item.goalAchievement && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">支援目標の達成度</label>
                      <div className="bg-gray-50 rounded-lg p-3 text-gray-900">{item.goalAchievement}</div>
                    </div>
                  )}

                  {item.currentIssues && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">今後の課題・解決方法</label>
                      <div className="bg-gray-50 rounded-lg p-3 text-gray-900">{item.currentIssues}</div>
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">計画の変更</label>
                    <div className="flex flex-wrap gap-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${item.planChanges.serviceChange ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'}`}>
                        サービス事業の変更: {item.planChanges.serviceChange ? '有' : '無'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs ${item.planChanges.serviceContent ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'}`}>
                        サービスの変更: {item.planChanges.serviceContent ? '有' : '無'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs ${item.planChanges.planModification ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'}`}>
                        連携計画の変更: {item.planChanges.planModification ? '有' : '無'}
                      </span>
                    </div>
                  </div>

                  {item.otherNotes && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">その他留意事項</label>
                      <div className="bg-gray-50 rounded-lg p-3 text-gray-900">{item.otherNotes}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">モニタリング報告書一覧</h1>
            <p className="text-gray-600 mt-1">
              {user.actualName}さんのモニタリング報告書
            </p>
          </div>
        </div>
        <button
          onClick={handleCreateNew}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          新しい報告書を作成
        </button>
      </div>

      {/* 報告書一覧 */}
      <div className="card">
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              モニタリング報告書がありません
            </h3>
            <p className="text-gray-500 mb-6">
              最初のモニタリング報告書を作成してください
            </p>
            <button
              onClick={handleCreateNew}
              className="btn-primary flex items-center mx-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              報告書を作成
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    作成日
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    モニタリング実施日
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    項目数
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">
                        {format(new Date(report.reportDate), 'yyyy年M月d日', { locale: ja })}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-700">
                      {format(new Date(report.monitoringDate), 'yyyy年M月d日', { locale: ja })}
                    </td>
                    <td className="py-4 px-4 text-gray-700">
                      {report.monitoringItems.length}項目
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewReport(report)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="詳細を表示"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default MonitoringView