import React from 'react'
import UrgentUsersList from './UrgentUsersList'
import TodayTasksList from './TodayTasksList'
import ProgressOverview from './ProgressOverview'

const Dashboard: React.FC = () => {

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* ヘッダーセクション */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">
          ミライアシスト ダッシュボード
        </h1>
        <p className="text-lg text-gray-600">
          相談支援専門員向けAI書類作成支援システム
        </p>
      </div>

      {/* 進捗統計とメイン機能 */}
      <ProgressOverview />

      {/* メインコンテンツエリア */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 緊急対応が必要な利用者 */}
        <div>
          <UrgentUsersList />
        </div>

        {/* 今日のタスク */}
        <div>
          <TodayTasksList />
        </div>
      </div>

      {/* 注意事項 */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">i</span>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">
              プライバシー保護について
            </h3>
            <p className="text-sm text-blue-800 leading-relaxed">
              このアプリケーションは個人情報保護を最優先に設計されています。
              すべての個人情報はAES暗号化でブラウザローカルに安全に保存され、インターネットへの送信は一切行われません。
              利用者情報は暗号化された状態で保存され、相談員が作業しやすいように復号化して表示しています。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard