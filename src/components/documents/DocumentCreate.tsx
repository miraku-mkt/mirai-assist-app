import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { 
  Upload, 
  FileText, 
  Calendar,
  ClipboardCheck,
  BarChart3,
  Mic,
  Image as ImageIcon,
  Type,
  Sparkles,
  Download,
  Eye,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { useDocumentStore } from '@/stores/documentStore'

type DocumentType = 'servicePlan' | 'weeklySchedule' | 'needsAssessment' | 'monitoringReport'

interface UploadedFile {
  id: string
  name: string
  type: 'audio' | 'image' | 'text'
  size: string
  content?: string
  uploadDate: Date
}

const DocumentCreate: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const { getUserById } = useUserStore()
  const { addInterviewRecord, getInterviewRecordsByUserId } = useDocumentStore()
  
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null)
  const [interviewText, setInterviewText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<any>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [showDetailedEditor, setShowDetailedEditor] = useState(false)
  const prevUserIdRef = useRef<string | undefined>()

  const user = userId ? getUserById(userId) : null

  useEffect(() => {
    // ユーザーIDが変更された場合のみリセット
    if (userId && userId !== prevUserIdRef.current) {
      setUploadedFiles([])
      setInterviewText('')
      prevUserIdRef.current = userId
    }
  }, [userId])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">利用者が見つかりません</p>
      </div>
    )
  }

  const documentTypes = [
    {
      id: 'servicePlan' as const,
      name: 'サービス等利用計画',
      description: 'サービス等利用計画書の作成',
      icon: FileText,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      id: 'weeklySchedule' as const,
      name: '週間計画表', 
      description: '週間スケジュールの作成',
      icon: Calendar,
      color: 'text-green-600 bg-green-100'
    },
    {
      id: 'needsAssessment' as const,
      name: 'ニーズ整理票',
      description: 'アセスメント情報の整理',
      icon: ClipboardCheck,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      id: 'monitoringReport' as const,
      name: 'モニタリング報告書',
      description: 'モニタリング結果の報告',
      icon: BarChart3,
      color: 'text-orange-600 bg-orange-100'
    }
  ]

  const handleFileUpload = (type: 'audio' | 'image' | 'text') => {
    const input = document.createElement('input')
    input.type = 'file'
    
    if (type === 'audio') {
      input.accept = 'audio/*'
    } else if (type === 'image') {
      input.accept = 'image/*'
    } else {
      input.accept = '.txt,.docx,.pdf'
    }

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        setIsUploading(true)
        
        try {
          let content = ''
          
          // テキストファイルの場合は内容を読み取り
          if (type === 'text' && file.type === 'text/plain') {
            content = await readTextFile(file)
            // テキストエリアに既存の内容と結合
            setInterviewText(prev => {
              const newContent = prev ? `${prev}\n\n--- ${file.name} ---\n${content}` : content
              return newContent
            })
          } else {
            content = `${file.name} (${type === 'audio' ? '音声' : type === 'image' ? '画像' : 'ファイル'}) がアップロードされました`
          }

          // ユニークIDを生成
          const fileId = crypto.randomUUID()
          const uploadDate = new Date()

          // 記録をデータベースに保存
          addInterviewRecord({
            userId: user.id,
            recordDate: uploadDate,
            recordType: type,
            content: content,
            fileName: file.name
          })

          // ファイルリストを更新
          const newFile: UploadedFile = {
            id: fileId,
            name: file.name,
            type: type,
            size: formatFileSize(file.size),
            content: content,
            uploadDate: uploadDate
          }
          
          setUploadedFiles(prev => {
            console.log('Previous files:', prev.length)
            console.log('Adding new file:', newFile.name)
            return [...prev, newFile]
          })

        } catch (error) {
          alert('ファイルの読み込みに失敗しました')
        } finally {
          setIsUploading(false)
        }
      }
    }

    input.click()
  }

  const readTextFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        resolve(e.target?.result as string)
      }
      reader.onerror = reject
      reader.readAsText(file, 'UTF-8')
    })
  }

  const handleRemoveFile = (fileId: string) => {
    // UIリストから削除
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
    
    // 注意: 現在の実装では、データベース削除機能は実装されていません
    // 実際の実装では deleteInterviewRecord(fileId) を呼び出す必要があります
  }

  const handleLoadFileContent = (file: UploadedFile) => {
    if (file.content && file.type === 'text') {
      setInterviewText(prev => {
        const newContent = prev ? `${prev}\n\n--- ${file.name} ---\n${file.content}` : file.content!
        return newContent
      })
    }
  }

  const handleGenerateDocument = async () => {
    console.log('AI生成ボタンがクリックされました')
    console.log('選択された書類タイプ:', selectedDocType)
    console.log('面談記録テキスト:', interviewText.trim())
    
    if (!selectedDocType || !interviewText.trim()) {
      alert('書類の種類を選択し、面談記録を入力してください')
      return
    }

    console.log('AI生成を開始します...')
    setIsGenerating(true)

    try {
      // 実際の実装では、ここでAI APIを呼び出す
      // 現在は、モックデータを生成
      await new Promise(resolve => setTimeout(resolve, 2000)) // 2秒待機

      const mockContent = generateMockContent(selectedDocType, user)
      console.log('生成されたコンテンツ:', mockContent)
      setGeneratedContent(mockContent)
      console.log('generatedContent状態が更新されました')

      // 面談記録を保存
      addInterviewRecord({
        userId: user.id,
        recordDate: new Date(),
        recordType: 'text',
        content: interviewText
      })

    } catch (error) {
      alert('書類生成中にエラーが発生しました')
    } finally {
      setIsGenerating(false)
    }
  }

  const generateMockContent = (docType: DocumentType, user: any) => {
    switch (docType) {
      case 'servicePlan':
        return {
          lifeGoals: '自立した生活を送り、地域社会に参加したい',
          comprehensiveSupport: '利用者の自立を支援し、社会参加を促進する',
          longTermGoals: '6か月後に就労継続支援A型での定期利用を目指す',
          shortTermGoals: '3か月後に生活リズムを整え、コミュニケーション能力を向上させる',
          services: [
            {
              priority: 1,
              issueToSolve: '生活リズムの改善',
              supportGoal: '規則正しい生活習慣の確立',
              completionPeriod: '3か月',
              serviceType: '生活介護',
              serviceDetails: '週3回、1日6時間の利用',
              providerName: '○○事業所',
              userRole: '毎日の記録をつける',
              evaluationPeriod: '月1回',
              otherNotes: '体調管理に注意'
            }
          ]
        }

      case 'weeklySchedule':
        return {
          schedule: [
            { day: 'monday', activities: ['9:00-15:00 生活介護サービス'] },
            { day: 'tuesday', activities: ['10:00-12:00 外来受診', '14:00-16:00 相談支援'] },
            { day: 'wednesday', activities: ['9:00-15:00 生活介護サービス'] },
            { day: 'thursday', activities: ['自宅で過ごす'] },
            { day: 'friday', activities: ['9:00-15:00 生活介護サービス'] },
            { day: 'saturday', activities: ['家族と過ごす'] },
            { day: 'sunday', activities: ['休息日'] }
          ],
          weeklyServices: '月1回の相談支援、3か月に1回のモニタリング',
          lifeOverview: 'サービス利用により規則正しい生活リズムを構築し、社会参加の機会を増やす'
        }

      case 'needsAssessment':
        return {
          intake: {
            basicInfo: '20歳男性、発達障害、家族と同居',
            expressedNeeds: '就労に向けた生活リズムの改善と対人関係スキルの向上を希望'
          },
          assessment: {
            livingConditions: '家族のサポートあり、基本的な生活は可能',
            psychologicalConditions: '新しい環境に不安を感じやすい',
            socialConditions: 'コミュニケーションに課題があるが、意欲は高い'
          },
          planning: {
            supportGoals: '段階的な社会参加と就労準備',
            supportMethods: '生活介護サービスを活用した日中活動の定着'
          }
        }

      case 'monitoringReport':
        return {
          comprehensiveSupport: '段階的な支援により着実に改善が見られる',
          overallStatus: '利用者・家族ともに満足度が高く、目標に向けて順調に進んでいる',
          monitoringItems: [
            {
              priority: 1,
              supportGoal: '生活リズムの改善',
              completionPeriod: '3か月',
              serviceStatus: '週3回の定期利用が定着している',
              userSatisfaction: '満足。スタッフとの関係も良好',
              goalAchievement: '80% - 大幅な改善が見られる',
              currentIssues: '雨天時の通所に課題',
              planChanges: {
                serviceChange: false,
                serviceContent: false,
                planModification: false
              },
              otherNotes: '今後も継続的な支援が必要'
            }
          ]
        }

      default:
        return null
    }
  }

  const handleDetailedEdit = () => {
    console.log('詳細編集ボタンがクリックされました')
    setShowDetailedEditor(true)
  }

  const exportToExcel = () => {
    // 実際の実装では、ExcelJSを使用してExcelファイルを生成
    alert('Excel出力機能は準備中です')
  }

  const handleCloseDetailedEditor = () => {
    setShowDetailedEditor(false)
  }

  const handleSaveDetailedEdit = () => {
    // 詳細編集の保存処理
    alert('編集内容を保存しました')
    setShowDetailedEditor(false)
  }

  const DetailedEditorModal = () => {
    if (!showDetailedEditor || !generatedContent) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900">
              詳細編集 - {documentTypes.find(d => d.id === selectedDocType)?.name}
            </h2>
            <button
              onClick={handleCloseDetailedEditor}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {selectedDocType === 'servicePlan' && (
              <div className="space-y-6">
                <div>
                  <label className="form-label">利用者及びその家族の生活に対する意向</label>
                  <textarea
                    value={generatedContent.lifeGoals || ''}
                    onChange={(e) => setGeneratedContent({
                      ...generatedContent,
                      lifeGoals: e.target.value
                    })}
                    className="textarea-field"
                    style={{ resize: 'vertical' }}
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="form-label">総合的な援助の方針</label>
                  <textarea
                    value={generatedContent.comprehensiveSupport || ''}
                    onChange={(e) => setGeneratedContent({
                      ...generatedContent,
                      comprehensiveSupport: e.target.value
                    })}
                    className="textarea-field"
                    style={{ resize: 'vertical' }}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="form-label">長期目標</label>
                  <textarea
                    value={generatedContent.longTermGoals || ''}
                    onChange={(e) => setGeneratedContent({
                      ...generatedContent,
                      longTermGoals: e.target.value
                    })}
                    className="textarea-field"
                    style={{ resize: 'vertical' }}
                    rows={2}
                  />
                </div>

                <div>
                  <label className="form-label">短期目標</label>
                  <textarea
                    value={generatedContent.shortTermGoals || ''}
                    onChange={(e) => setGeneratedContent({
                      ...generatedContent,
                      shortTermGoals: e.target.value
                    })}
                    className="textarea-field"
                    style={{ resize: 'vertical' }}
                    rows={2}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">サービス詳細</h3>
                  {generatedContent.services?.map((service: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 mb-4 bg-gray-50">
                      <h4 className="font-medium text-gray-800 mb-3">優先順位 {service.priority}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label text-sm">解決すべき課題</label>
                          <input
                            type="text"
                            value={service.issueToSolve || ''}
                            onChange={(e) => {
                              const newServices = [...generatedContent.services]
                              newServices[index].issueToSolve = e.target.value
                              setGeneratedContent({
                                ...generatedContent,
                                services: newServices
                              })
                            }}
                            className="input-field"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label text-sm">支援目標</label>
                          <input
                            type="text"
                            value={service.supportGoal || ''}
                            onChange={(e) => {
                              const newServices = [...generatedContent.services]
                              newServices[index].supportGoal = e.target.value
                              setGeneratedContent({
                                ...generatedContent,
                                services: newServices
                              })
                            }}
                            className="input-field"
                          />
                        </div>

                        <div>
                          <label className="form-label text-sm">達成時期</label>
                          <input
                            type="text"
                            value={service.completionPeriod || ''}
                            onChange={(e) => {
                              const newServices = [...generatedContent.services]
                              newServices[index].completionPeriod = e.target.value
                              setGeneratedContent({
                                ...generatedContent,
                                services: newServices
                              })
                            }}
                            className="input-field"
                          />
                        </div>

                        <div>
                          <label className="form-label text-sm">福祉サービス等</label>
                          <input
                            type="text"
                            value={service.serviceType || ''}
                            onChange={(e) => {
                              const newServices = [...generatedContent.services]
                              newServices[index].serviceType = e.target.value
                              setGeneratedContent({
                                ...generatedContent,
                                services: newServices
                              })
                            }}
                            className="input-field"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="form-label text-sm">種類・内容・量・頻度・時間</label>
                          <textarea
                            value={service.serviceDetails || ''}
                            onChange={(e) => {
                              const newServices = [...generatedContent.services]
                              newServices[index].serviceDetails = e.target.value
                              setGeneratedContent({
                                ...generatedContent,
                                services: newServices
                              })
                            }}
                            className="textarea-field"
                            style={{ resize: 'vertical' }}
                            rows={2}
                          />
                        </div>

                        <div>
                          <label className="form-label text-sm">提供事業所名</label>
                          <input
                            type="text"
                            value={service.providerName || ''}
                            onChange={(e) => {
                              const newServices = [...generatedContent.services]
                              newServices[index].providerName = e.target.value
                              setGeneratedContent({
                                ...generatedContent,
                                services: newServices
                              })
                            }}
                            className="input-field"
                          />
                        </div>

                        <div>
                          <label className="form-label text-sm">本人の役割</label>
                          <input
                            type="text"
                            value={service.userRole || ''}
                            onChange={(e) => {
                              const newServices = [...generatedContent.services]
                              newServices[index].userRole = e.target.value
                              setGeneratedContent({
                                ...generatedContent,
                                services: newServices
                              })
                            }}
                            className="input-field"
                          />
                        </div>

                        <div>
                          <label className="form-label text-sm">評価時期</label>
                          <input
                            type="text"
                            value={service.evaluationPeriod || ''}
                            onChange={(e) => {
                              const newServices = [...generatedContent.services]
                              newServices[index].evaluationPeriod = e.target.value
                              setGeneratedContent({
                                ...generatedContent,
                                services: newServices
                              })
                            }}
                            className="input-field"
                          />
                        </div>

                        <div>
                          <label className="form-label text-sm">その他留意事項</label>
                          <input
                            type="text"
                            value={service.otherNotes || ''}
                            onChange={(e) => {
                              const newServices = [...generatedContent.services]
                              newServices[index].otherNotes = e.target.value
                              setGeneratedContent({
                                ...generatedContent,
                                services: newServices
                              })
                            }}
                            className="input-field"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedDocType === 'needsAssessment' && (
              <div className="space-y-8">
                {/* 1. インテーク段階 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">1. インテーク段階</h3>
                  <div className="space-y-4 ml-4">
                    <h4 className="text-base font-medium text-gray-800">情報の整理</h4>
                    
                    <div className="ml-4 space-y-4">
                      <div>
                        <label className="form-label">本人の表明している希望・解決したい課題</label>
                        <textarea
                          value={generatedContent.intake?.expressedNeeds || ''}
                          onChange={(e) => setGeneratedContent({
                            ...generatedContent,
                            intake: {
                              ...generatedContent.intake,
                              expressedNeeds: e.target.value
                            }
                          })}
                          className="textarea-field"
                          style={{ resize: 'vertical' }}
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="form-label">相談員がおさえておきたい情報</label>
                        <textarea
                          value={generatedContent.intake?.counselorNotes || ''}
                          onChange={(e) => setGeneratedContent({
                            ...generatedContent,
                            intake: {
                              ...generatedContent.intake,
                              counselorNotes: e.target.value
                            }
                          })}
                          className="textarea-field"
                          style={{ resize: 'vertical' }}
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. アセスメント段階 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">2. アセスメント段階</h3>
                  <div className="space-y-6 ml-4">
                    
                    {/* 理解・解釈・仮説① */}
                    <div>
                      <h4 className="text-base font-medium text-gray-800 mb-3">理解・解釈・仮説（相談員のとらえ方、解釈・推測）</h4>
                      <div className="ml-4 space-y-4">
                        <div>
                          <label className="form-label">本人【生物的なこと】</label>
                          <textarea
                            value={generatedContent.assessment?.biological || ''}
                            onChange={(e) => setGeneratedContent({
                              ...generatedContent,
                              assessment: {
                                ...generatedContent.assessment,
                                biological: e.target.value
                              }
                            })}
                            className="textarea-field"
                            style={{ resize: 'vertical' }}
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className="form-label">本人【心理的なこと】</label>
                          <textarea
                            value={generatedContent.assessment?.psychological || ''}
                            onChange={(e) => setGeneratedContent({
                              ...generatedContent,
                              assessment: {
                                ...generatedContent.assessment,
                                psychological: e.target.value
                              }
                            })}
                            className="textarea-field"
                            style={{ resize: 'vertical' }}
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className="form-label">本人【社会性・対人関係の特徴】</label>
                          <textarea
                            value={generatedContent.assessment?.social || ''}
                            onChange={(e) => setGeneratedContent({
                              ...generatedContent,
                              assessment: {
                                ...generatedContent.assessment,
                                social: e.target.value
                              }
                            })}
                            className="textarea-field"
                            style={{ resize: 'vertical' }}
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className="form-label">環境</label>
                          <textarea
                            value={generatedContent.assessment?.environment || ''}
                            onChange={(e) => setGeneratedContent({
                              ...generatedContent,
                              assessment: {
                                ...generatedContent.assessment,
                                environment: e.target.value
                              }
                            })}
                            className="textarea-field"
                            style={{ resize: 'vertical' }}
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 理解・解釈・仮説② */}
                    <div>
                      <h4 className="text-base font-medium text-gray-800 mb-3">理解・解釈・仮説②（専門的アセスメントや他者の解釈・推測）</h4>
                      <div className="ml-4">
                        <textarea
                          value={generatedContent.assessment?.professionalAssessment || ''}
                          onChange={(e) => setGeneratedContent({
                            ...generatedContent,
                            assessment: {
                              ...generatedContent.assessment,
                              professionalAssessment: e.target.value
                            }
                          })}
                          className="textarea-field"
                          style={{ resize: 'vertical' }}
                          rows={4}
                        />
                      </div>
                    </div>

                    {/* 支援課題 */}
                    <div>
                      <h4 className="text-base font-medium text-gray-800 mb-3">支援課題（支援が必要と相談員が思うこと）</h4>
                      <div className="ml-4">
                        <textarea
                          value={generatedContent.assessment?.supportIssues || ''}
                          onChange={(e) => setGeneratedContent({
                            ...generatedContent,
                            assessment: {
                              ...generatedContent.assessment,
                              supportIssues: e.target.value
                            }
                          })}
                          className="textarea-field"
                          style={{ resize: 'vertical' }}
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. プランニング段階 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">3. プランニング段階</h3>
                  <div className="ml-4">
                    <div>
                      <label className="form-label">対応・方針（相談員がやろうと思うこと）</label>
                      <textarea
                        value={generatedContent.planning?.supportMethods || ''}
                        onChange={(e) => setGeneratedContent({
                          ...generatedContent,
                          planning: {
                            ...generatedContent.planning,
                            supportMethods: e.target.value
                          }
                        })}
                        className="textarea-field"
                        style={{ resize: 'vertical' }}
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                {/* 4. 本人像の要約 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">4. 今回大づかみにとらえた本人像</h3>
                  <div className="ml-4">
                    <label className="form-label">100文字程度で要約する</label>
                    <textarea
                      value={generatedContent.personSummary || ''}
                      onChange={(e) => setGeneratedContent({
                        ...generatedContent,
                        personSummary: e.target.value
                      })}
                      className="textarea-field"
                      style={{ resize: 'vertical' }}
                      rows={3}
                      maxLength={120}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {(generatedContent.personSummary || '').length}/100文字
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 p-6 border-t bg-gray-50 flex-shrink-0">
            <button
              onClick={handleCloseDetailedEditor}
              className="btn-secondary"
            >
              キャンセル
            </button>
            <button
              onClick={handleSaveDetailedEdit}
              className="btn-primary"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          書類作成 - {user.actualName}さん
        </h1>
        <p className="text-gray-600 mt-1">
          面談記録をもとにAIが各種書類を自動生成します
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左側：入力エリア */}
        <div className="space-y-6">
          {/* 書類タイプ選択 */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              1. 作成する書類を選択
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {documentTypes.map((docType) => (
                <button
                  key={docType.id}
                  onClick={() => setSelectedDocType(docType.id)}
                  className={`p-4 rounded-lg border-2 transition-colors text-left ${
                    selectedDocType === docType.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${docType.color}`}>
                    <docType.icon size={18} />
                  </div>
                  <div className="font-medium text-gray-900 mb-1">
                    {docType.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {docType.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 面談記録のアップロード */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              2. 面談記録をアップロード
            </h2>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <button
                onClick={() => handleFileUpload('audio')}
                className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isUploading}
              >
                <Mic className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">音声ファイル</span>
                <span className="text-xs text-gray-500 mt-1">MP3, WAV等</span>
              </button>

              <button
                onClick={() => handleFileUpload('image')}
                className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isUploading}
              >
                <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">画像ファイル</span>
                <span className="text-xs text-gray-500 mt-1">JPG, PNG等</span>
              </button>

              <button
                onClick={() => handleFileUpload('text')}
                className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isUploading}
              >
                <Type className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">テキストファイル</span>
                <span className="text-xs text-gray-500 mt-1">TXT, DOCX等</span>
              </button>
            </div>

            {isUploading && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mr-3" />
                <span className="text-sm text-gray-600">ファイルをアップロード中...</span>
              </div>
            )}

            {/* アップロード済みファイル一覧 */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">アップロード済みファイル</h3>
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {file.type === 'audio' ? (
                            <Mic className="w-5 h-5 text-blue-500" />
                          ) : file.type === 'image' ? (
                            <ImageIcon className="w-5 h-5 text-green-500" />
                          ) : (
                            <FileText className="w-5 h-5 text-purple-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{file.size}</span>
                            <span>•</span>
                            <span>
                              {new Date(file.uploadDate).toLocaleString('ja-JP', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {file.type === 'text' && file.content && (
                          <button
                            onClick={() => handleLoadFileContent(file)}
                            className="p-1 text-primary-600 hover:text-primary-800 hover:bg-primary-100 rounded transition-colors"
                            title="テキストエリアに読み込み"
                          >
                            <Download size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveFile(file.id)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                          title="ファイルを削除"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                または、直接テキストを入力
              </label>
              <textarea
                value={interviewText}
                onChange={(e) => setInterviewText(e.target.value)}
                className="textarea-field min-h-[120px]"
                placeholder="面談の内容、利用者の状況、希望、課題などを記入してください..."
              />
            </div>
          </div>

          {/* デバッグ情報 */}
          <div className="text-xs text-gray-500 space-y-1 mb-4">
            <div>選択された書類: {selectedDocType || 'なし'}</div>
            <div>テキスト長: {interviewText.length}文字</div>
            <div>生成中: {isGenerating ? 'はい' : 'いいえ'}</div>
            <div>ボタン有効: {selectedDocType && interviewText.trim() && !isGenerating ? 'はい' : 'いいえ'}</div>
          </div>

          {/* AI生成ボタン */}
          <button
            onClick={handleGenerateDocument}
            disabled={!selectedDocType || !interviewText.trim() || isGenerating}
            className={`w-full min-h-[44px] flex items-center justify-center font-medium py-3 px-6 rounded-lg transition-colors duration-200 ${
              !selectedDocType || !interviewText.trim() || isGenerating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                AI生成中...
              </>
            ) : (
              <>
                <Sparkles size={20} className="mr-2" />
                AIで書類を生成
              </>
            )}
          </button>
        </div>

        {/* 右側：生成結果 */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            3. 生成結果の確認・編集
          </h2>

          {!generatedContent ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                書類を選択し、面談記録を入力してAI生成を実行してください
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm">
                  ✓ 書類が正常に生成されました。内容を確認して編集してください。
                </p>
              </div>

              {/* 生成されたコンテンツの表示（簡略版） */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">生成内容プレビュー</h3>
                <div className="text-sm text-gray-700 space-y-2">
                  {selectedDocType === 'servicePlan' && (
                    <>
                      <p><strong>生活に対する意向:</strong> {generatedContent.lifeGoals}</p>
                      <p><strong>援助の方針:</strong> {generatedContent.comprehensiveSupport}</p>
                      <p><strong>長期目標:</strong> {generatedContent.longTermGoals}</p>
                      <p><strong>短期目標:</strong> {generatedContent.shortTermGoals}</p>
                    </>
                  )}
                  {selectedDocType === 'needsAssessment' && (
                    <>
                      <p><strong>基本情報:</strong> {generatedContent.intake.basicInfo}</p>
                      <p><strong>表現されたニーズ:</strong> {generatedContent.intake.expressedNeeds}</p>
                    </>
                  )}
                  {/* 他の書類タイプの表示内容 */}
                </div>
              </div>

              <div className="flex space-x-4">
                <button 
                  onClick={handleDetailedEdit}
                  className="btn-secondary flex-1"
                >
                  <Eye size={18} className="mr-2" />
                  詳細編集
                </button>
                <button
                  onClick={exportToExcel}
                  className="btn-primary flex-1"
                >
                  <Download size={18} className="mr-2" />
                  Excel出力
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 詳細編集モーダル */}
      <DetailedEditorModal />
    </div>
  )
}

export default DocumentCreate