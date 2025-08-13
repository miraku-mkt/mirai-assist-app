import React, { useState, useEffect, useRef, useCallback, createRef, memo } from 'react'
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

type DocumentType = 'servicePlan' | 'weeklySchedule' | 'needsAssessment'

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
  const { 
    addInterviewRecord, 
    getInterviewRecordsByUserId,
    addServicePlan,
    getServicePlansByUserId,
    addWeeklySchedule,
    getWeeklySchedulesByUserId,
    addNeedsAssessment,
    getNeedsAssessmentsByUserId,
    updateServicePlan,
    updateWeeklySchedule,
    updateNeedsAssessment
  } = useDocumentStore()
  
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null)
  const [interviewText, setInterviewText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<any>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [showDetailedEditor, setShowDetailedEditor] = useState(false)
  const [localScheduleData, setLocalScheduleData] = useState<any>({})
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

  // 週間スケジュール用の最適化されたonChangeハンドラー
  const updateTimeSlot = useCallback((day: string, slotIndex: number, field: string, value: any) => {
    console.log('updateTimeSlot called:', { day, slotIndex, field, value })
    
    setGeneratedContent((prev: any) => {
      console.log('prev generatedContent:', prev)
      if (!prev || !prev.schedule) {
        console.log('No prev or schedule, returning prev')
        return prev
      }

      const newSchedule = prev.schedule.map((daySchedule: any) => {
        if (daySchedule.day !== day) return daySchedule

        const newTimeSlots = [...(daySchedule.timeSlots || [])]
        
        // timeSlotが存在しない場合は作成
        if (!newTimeSlots[slotIndex]) {
          console.log('Creating new timeSlot at index:', slotIndex)
          newTimeSlots[slotIndex] = { startTime: '', endTime: '', activity: '', isService: false }
        }

        // フィールドを更新
        const oldSlot = newTimeSlots[slotIndex]
        newTimeSlots[slotIndex] = {
          ...oldSlot,
          [field]: value
        }
        
        console.log('Updated timeSlot:', newTimeSlots[slotIndex])

        return {
          ...daySchedule,
          timeSlots: newTimeSlots
        }
      })

      // dayが存在しない場合は追加
      const dayExists = newSchedule.some((s: any) => s.day === day)
      if (!dayExists) {
        console.log('Day does not exist, creating new day schedule')
        const newTimeSlot = { startTime: '', endTime: '', activity: '', isService: false }
        newTimeSlot[field as keyof typeof newTimeSlot] = value
        newSchedule.push({
          day,
          timeSlots: [newTimeSlot]
        })
      }

      const result = {
        ...prev,
        schedule: newSchedule
      }
      console.log('New generatedContent:', result)
      return result
    })
  }, [])

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
      id: 'needsAssessment' as const,
      name: 'ニーズ整理票',
      description: '【第1段階】面談記録からのアセスメント情報整理',
      icon: ClipboardCheck,
      color: 'text-purple-600 bg-purple-100',
      step: 1
    },
    {
      id: 'servicePlan' as const,
      name: 'サービス等利用計画',
      description: '【第2段階】ニーズ整理票を基にしたサービス計画書作成',
      icon: FileText,
      color: 'text-blue-600 bg-blue-100',
      step: 2
    },
    {
      id: 'weeklySchedule' as const,
      name: '週間計画表', 
      description: '【第2段階】サービス計画に基づく週間スケジュール作成',
      icon: Calendar,
      color: 'text-green-600 bg-green-100',
      step: 2
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

      // 生成された文書をストアに保存
      switch (selectedDocType) {
        case 'servicePlan':
          // 既存のサービス計画があるかチェック
          const existingServicePlans = getServicePlansByUserId(user.id)
          if (existingServicePlans.length > 0) {
            // 更新
            updateServicePlan(existingServicePlans[existingServicePlans.length - 1].id, {
              content: mockContent
            })
          } else {
            // 新規作成
            addServicePlan({
              userId: user.id,
              title: `サービス等利用計画 - ${user.actualName}`,
              content: mockContent,
              status: 'draft'
            })
          }
          break
        case 'weeklySchedule':
          const existingWeeklySchedules = getWeeklySchedulesByUserId(user.id)
          if (existingWeeklySchedules.length > 0) {
            updateWeeklySchedule(existingWeeklySchedules[existingWeeklySchedules.length - 1].id, {
              content: mockContent
            })
          } else {
            addWeeklySchedule({
              userId: user.id,
              title: `週間計画表 - ${user.actualName}`,
              content: mockContent,
              status: 'draft'
            })
          }
          break
        case 'needsAssessment':
          const existingNeedsAssessments = getNeedsAssessmentsByUserId(user.id)
          if (existingNeedsAssessments.length > 0) {
            updateNeedsAssessment(existingNeedsAssessments[existingNeedsAssessments.length - 1].id, {
              content: mockContent
            })
          } else {
            addNeedsAssessment({
              userId: user.id,
              title: `ニーズ整理票 - ${user.actualName}`,
              content: mockContent,
              status: 'draft'
            })
          }
          break
      }

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
          startDate: new Date(),
          schedule: [
            {
              day: 'monday',
              timeSlots: [
                { startTime: '09:00', endTime: '15:00', activity: '生活介護サービス', isService: true },
                { startTime: '19:00', endTime: '20:00', activity: '夕食・入浴', isService: false }
              ]
            },
            {
              day: 'tuesday', 
              timeSlots: [
                { startTime: '10:00', endTime: '12:00', activity: '外来受診', isService: false },
                { startTime: '14:00', endTime: '16:00', activity: '相談支援', isService: true }
              ]
            },
            {
              day: 'wednesday',
              timeSlots: [
                { startTime: '09:00', endTime: '15:00', activity: '生活介護サービス', isService: true }
              ]
            },
            {
              day: 'thursday',
              timeSlots: [
                { startTime: '10:00', endTime: '16:00', activity: '自宅で過ごす', isService: false }
              ]
            },
            {
              day: 'friday',
              timeSlots: [
                { startTime: '09:00', endTime: '15:00', activity: '生活介護サービス', isService: true }
              ]
            },
            {
              day: 'saturday',
              timeSlots: [
                { startTime: '10:00', endTime: '17:00', activity: '家族と過ごす', isService: false }
              ]
            },
            {
              day: 'sunday',
              timeSlots: [
                { startTime: '10:00', endTime: '16:00', activity: '休息日', isService: false }
              ]
            }
          ],
          weeklyServices: '月1回の相談支援、3か月に1回のモニタリング',
          lifeOverview: 'サービス利用により規則正しい生活リズムを構築し、社会参加の機会を増やす'
        }

      case 'needsAssessment':
        return {
          intake: {
            expressedNeeds: `${user.actualName}さんは「将来的に自立した生活を送りたい」「働く場所を見つけたい」「人とのコミュニケーションを上手になりたい」と希望を表明されている。家族からの支援を受けながらも、できるだけ自分のことは自分でやりたいという意向がある。`,
            counselorNotes: `${user.disabilityType}（障害支援区分：${user.disabilitySupportCategory}）。家族と同居。日常生活において部分的な支援が必要。医療機関での定期受診あり。これまでの福祉サービス利用経験は限定的。家族の介護負担軽減も課題となっている。`
          },
          assessment: {
            biological: `身体機能：${user.disabilityType}による機能制限があるが、基本的な移動や身の回りのことは概ね自立している。服薬管理は家族による支援が必要。定期的な医療機関受診により健康状態は安定している。疲労しやすい傾向があり、活動量の調整が必要。`,
            psychological: `認知面では理解力があり、自分の意思を表現することができる。新しい環境や変化に対して不安を感じやすく、時間をかけた説明や段階的な導入が効果的。将来への希望を持っており、意欲的に取り組む姿勢が見られる。自己肯定感の向上が課題。`,
            social: `家族との関係は良好で、信頼関係が築けている。初対面の人とのコミュニケーションには時間がかかるが、慣れた相手とは適切な関係を維持できる。集団での活動には参加意欲があるものの、人数や環境によって疲労度が変わる。社会性の向上に向けた段階的な取り組みが有効。`,
            environment: `家族との同居により安定した生活環境が確保されている。住環境は障害に配慮した設備が一部整備済み。地域の社会資源については情報が限定的で、活用の余地がある。交通手段は主に家族による送迎に依存しており、公共交通機関の利用には課題がある。`,
            professionalAssessment: `医師からは「症状は安定しており、適切な環境と支援があれば社会参加は十分可能」との見解。これまでの支援者からは「本人のペースに合わせた段階的な支援が効果的」との評価。心理検査結果では認知機能に大きな問題はなく、適応能力の向上が期待される。`,
            supportIssues: `1. 生活リズムの安定化と体調管理の支援 2. 社会参加に向けた段階的な環境設定 3. コミュニケーション能力の向上支援 4. 家族の介護負担軽減 5. 地域資源の活用促進 6. 将来的な就労に向けた準備支援 7. 自己肯定感と自立意識の醸成`
          },
          planning: {
            supportMethods: `本人のペースを尊重した段階的な支援プログラムを実施。まずは生活介護サービスでの日中活動を通じて生活リズムを安定させ、集団活動への適応を図る。併せて相談支援を活用し、本人・家族の不安軽減と情報提供を行う。医療機関との連携を継続し、定期的なモニタリングを実施する。`
          },
          personSummary: `${user.actualName}さんは向上心があり、支援者との信頼関係を築くことができる方です。自分のペースで着実に成長していく力を持っており、適切な環境と段階的な支援により、社会参加と自立に向けた歩みを進めることが期待されます。`
        }

      default:
        return null
    }
  }

  const handleDetailedEdit = () => {
    console.log('詳細編集ボタンがクリックされました')
    setShowDetailedEditor(true)
  }

  const handleManualCreate = () => {
    console.log('手動作成ボタンがクリックされました')
    console.log('選択された書類タイプ:', selectedDocType)
    
    if (!selectedDocType) {
      alert('書類の種類を選択してください')
      return
    }

    // 空のテンプレートを生成
    const emptyTemplate = generateEmptyTemplate(selectedDocType, user)
    setGeneratedContent(emptyTemplate)
    console.log('空のテンプレートが生成されました:', emptyTemplate)
    
    // 空のテンプレートをストアに保存
    if (userId) {
      switch (selectedDocType) {
        case 'servicePlan':
          const existingServicePlans = getServicePlansByUserId(userId)
          if (existingServicePlans.length > 0) {
            updateServicePlan(existingServicePlans[existingServicePlans.length - 1].id, {
              content: emptyTemplate
            })
          } else {
            addServicePlan({
              userId: userId,
              title: `サービス等利用計画 - ${user?.actualName}`,
              content: emptyTemplate,
              status: 'draft'
            })
          }
          break
        case 'weeklySchedule':
          const existingWeeklySchedules = getWeeklySchedulesByUserId(userId)
          if (existingWeeklySchedules.length > 0) {
            updateWeeklySchedule(existingWeeklySchedules[existingWeeklySchedules.length - 1].id, {
              content: emptyTemplate
            })
          } else {
            addWeeklySchedule({
              userId: userId,
              title: `週間計画表 - ${user?.actualName}`,
              content: emptyTemplate,
              status: 'draft'
            })
          }
          break
        case 'needsAssessment':
          const existingNeedsAssessments = getNeedsAssessmentsByUserId(userId)
          if (existingNeedsAssessments.length > 0) {
            updateNeedsAssessment(existingNeedsAssessments[existingNeedsAssessments.length - 1].id, {
              content: emptyTemplate
            })
          } else {
            addNeedsAssessment({
              userId: userId,
              title: `ニーズ整理票 - ${user?.actualName}`,
              content: emptyTemplate,
              status: 'draft'
            })
          }
          break
      }
    }
    
    // 直接詳細編集画面を開く
    setShowDetailedEditor(true)
  }

  const generateEmptyTemplate = (docType: DocumentType, user: any) => {
    switch (docType) {
      case 'servicePlan':
        return {
          lifeGoals: '',
          comprehensiveSupport: '',
          longTermGoals: '',
          shortTermGoals: '',
          services: [
            {
              priority: 1,
              issueToSolve: '',
              supportGoal: '',
              completionPeriod: '',
              serviceType: '',
              serviceDetails: '',
              providerName: '',
              userRole: '',
              evaluationPeriod: '',
              otherNotes: ''
            }
          ]
        }
      
      case 'weeklySchedule':
        return {
          startDate: new Date(),
          schedule: [
            { day: 'monday', timeSlots: [{ startTime: '', endTime: '', activity: '', isService: false }] },
            { day: 'tuesday', timeSlots: [{ startTime: '', endTime: '', activity: '', isService: false }] },
            { day: 'wednesday', timeSlots: [{ startTime: '', endTime: '', activity: '', isService: false }] },
            { day: 'thursday', timeSlots: [{ startTime: '', endTime: '', activity: '', isService: false }] },
            { day: 'friday', timeSlots: [{ startTime: '', endTime: '', activity: '', isService: false }] },
            { day: 'saturday', timeSlots: [{ startTime: '', endTime: '', activity: '', isService: false }] },
            { day: 'sunday', timeSlots: [{ startTime: '', endTime: '', activity: '', isService: false }] }
          ],
          weeklyServices: '',
          lifeOverview: ''
        }
      
      case 'needsAssessment':
        return {
          intake: {
            expressedNeeds: '',
            counselorNotes: ''
          },
          assessment: {
            biological: '',
            psychological: '',
            social: '',
            environment: '',
            professionalAssessment: '',
            supportIssues: ''
          },
          planning: {
            supportMethods: ''
          },
          personSummary: ''
        }
      
      default:
        return null
    }
  }

  const exportToExcel = () => {
    // 実際の実装では、ExcelJSを使用してExcelファイルを生成
    alert('Excel出力機能は準備中です')
  }

  const handleCloseDetailedEditor = () => {
    setShowDetailedEditor(false)
  }

  const handleSaveDetailedEdit = () => {
    if (!selectedDocType || !generatedContent || !userId) return
    
    // 詳細編集の保存処理
    switch (selectedDocType) {
      case 'servicePlan':
        const existingServicePlans = getServicePlansByUserId(userId)
        if (existingServicePlans.length > 0) {
          updateServicePlan(existingServicePlans[existingServicePlans.length - 1].id, {
            content: generatedContent
          })
        } else {
          addServicePlan({
            userId: userId,
            title: `サービス等利用計画 - ${user?.actualName}`,
            content: generatedContent,
            status: 'draft'
          })
        }
        break
      case 'weeklySchedule':
        const existingWeeklySchedules = getWeeklySchedulesByUserId(userId)
        if (existingWeeklySchedules.length > 0) {
          updateWeeklySchedule(existingWeeklySchedules[existingWeeklySchedules.length - 1].id, {
            content: generatedContent
          })
        } else {
          addWeeklySchedule({
            userId: userId,
            title: `週間計画表 - ${user?.actualName}`,
            content: generatedContent,
            status: 'draft'
          })
        }
        break
      case 'needsAssessment':
        const existingNeedsAssessments = getNeedsAssessmentsByUserId(userId)
        if (existingNeedsAssessments.length > 0) {
          updateNeedsAssessment(existingNeedsAssessments[existingNeedsAssessments.length - 1].id, {
            content: generatedContent
          })
        } else {
          addNeedsAssessment({
            userId: userId,
            title: `ニーズ整理票 - ${user?.actualName}`,
            content: generatedContent,
            status: 'draft'
          })
        }
        break
    }
    
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
                    <div key={index} className="border rounded-lg p-4 mb-4 bg-gray-50 relative">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-800">優先順位 {service.priority}</h4>
                        {generatedContent.services.length > 1 && (
                          <button
                            onClick={() => {
                              const newServices = generatedContent.services.filter((_, i) => i !== index)
                              // 優先順位を再調整
                              const reorderedServices = newServices.map((service, idx) => ({
                                ...service,
                                priority: idx + 1
                              }))
                              setGeneratedContent({
                                ...generatedContent,
                                services: reorderedServices
                              })
                            }}
                            className="text-red-600 hover:text-red-800 text-sm px-2 py-1 hover:bg-red-50 rounded"
                          >
                            ✕ 削除
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label text-sm">解決すべき課題（本人のニーズ）</label>
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

                        <div className="md:col-span-2">
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

                        <div className="md:col-span-2">
                          <h5 className="text-sm font-medium text-gray-700 mb-2 mt-4">福祉サービス等</h5>
                        </div>

                        <div className="md:col-span-2">
                          <label className="form-label text-sm">種類・内容・量（頻度・時間）</label>
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

                        <div className="md:col-span-2">
                          <label className="form-label text-sm">提供事業所名（担当者名・電話）</label>
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
                          <label className="form-label text-sm">課題解決のための本人の役割</label>
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
                  
                  <div className="flex justify-between items-center mt-4">
                    <button
                      onClick={() => {
                        const newServices = [...(generatedContent.services || [])]
                        const newPriority = newServices.length > 0 ? Math.max(...newServices.map(s => s.priority)) + 1 : 1
                        newServices.push({
                          priority: newPriority,
                          issueToSolve: '',
                          supportGoal: '',
                          completionPeriod: '',
                          serviceType: '',
                          serviceDetails: '',
                          providerName: '',
                          userRole: '',
                          evaluationPeriod: '',
                          otherNotes: ''
                        })
                        setGeneratedContent({
                          ...generatedContent,
                          services: newServices
                        })
                      }}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <span>+</span>
                      <span>サービス項目を追加</span>
                    </button>
                    
                    {generatedContent.services && generatedContent.services.length > 1 && (
                      <button
                        onClick={() => {
                          const newServices = [...generatedContent.services]
                          newServices.pop() // 最後の項目を削除
                          setGeneratedContent({
                            ...generatedContent,
                            services: newServices
                          })
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                      >
                        <span>−</span>
                        <span>最後の項目を削除</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedDocType === 'weeklySchedule' && (
              <div className="space-y-6">
                <div>
                  <label className="form-label">計画開始年月</label>
                  <input
                    type="month"
                    value={generatedContent.startDate ? new Date(generatedContent.startDate).toISOString().slice(0, 7) : ''}
                    onChange={(e) => setGeneratedContent({
                      ...generatedContent,
                      startDate: e.target.value ? new Date(e.target.value + '-01') : new Date()
                    })}
                    className="input-field"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">週間スケジュール</h3>
                  <div className="space-y-4">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day, dayIndex) => {
                      const dayNames = {
                        monday: '月曜日',
                        tuesday: '火曜日', 
                        wednesday: '水曜日',
                        thursday: '木曜日',
                        friday: '金曜日',
                        saturday: '土曜日',
                        sunday: '日曜日'
                      }
                      
                      const currentSchedule = generatedContent.schedule?.find((s: any) => s.day === day) || { day, timeSlots: [{ startTime: '', endTime: '', activity: '', isService: false }] }
                      
                      return (
                        <div key={day} className="border rounded-lg p-4 bg-gray-50">
                          <h4 className="font-medium text-gray-800 mb-3">{dayNames[day as keyof typeof dayNames]}</h4>
                          
                          <div className="space-y-2">
                            {(currentSchedule.timeSlots && currentSchedule.timeSlots.length > 0 ? currentSchedule.timeSlots : [{ startTime: '', endTime: '', activity: '', isService: false }]).map((slot: any, slotIndex: number) => (
                              <div key={`${day}-${slotIndex}`} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center p-2 bg-white rounded border">
                                <input
                                  type="time"
                                  value={slot?.startTime || ''}
                                  onChange={(e) => updateTimeSlot(day, slotIndex, 'startTime', e.target.value)}
                                  className="input-field text-sm"
                                  title="開始時刻"
                                />
                                <input
                                  type="time"
                                  value={slot?.endTime || ''}
                                  onChange={(e) => updateTimeSlot(day, slotIndex, 'endTime', e.target.value)}
                                  className="input-field text-sm"
                                  title="終了時刻"
                                />
                                <input
                                  type="text"
                                  placeholder="活動内容を入力"
                                  defaultValue={slot?.activity || ''}
                                  onBlur={(e) => {
                                    // フォーカスが外れた時のみ状態を更新
                                    const newValue = e.target.value
                                    setGeneratedContent((prev: any) => {
                                      if (!prev?.schedule) return prev
                                      
                                      const schedule = prev.schedule.map((daySchedule: any) => {
                                        if (daySchedule.day !== day) return daySchedule
                                        
                                        const timeSlots = [...(daySchedule.timeSlots || [])]
                                        if (!timeSlots[slotIndex]) {
                                          timeSlots[slotIndex] = { startTime: '', endTime: '', activity: '', isService: false }
                                        }
                                        
                                        timeSlots[slotIndex] = {
                                          ...timeSlots[slotIndex],
                                          activity: newValue
                                        }
                                        
                                        return { ...daySchedule, timeSlots }
                                      })
                                      
                                      return { ...prev, schedule }
                                    })
                                  }}
                                  className="input-field text-sm flex-1"
                                  style={{ minWidth: '150px' }}
                                />
                                <div className="flex space-x-1">
                                  <label className="flex items-center text-sm">
                                    <input
                                      type="checkbox"
                                      checked={slot?.isService || false}
                                      onChange={(e) => updateTimeSlot(day, slotIndex, 'isService', e.target.checked)}
                                      className="mr-1"
                                    />
                                    サービス
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newSchedule = [...(generatedContent.schedule || [])]
                                      let daySchedule = newSchedule.find(s => s.day === day)
                                      if (daySchedule && daySchedule.timeSlots) {
                                        daySchedule.timeSlots.splice(slotIndex, 1)
                                      }
                                      setGeneratedContent({
                                        ...generatedContent,
                                        schedule: newSchedule
                                      })
                                    }}
                                    className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
                                  >
                                    削除
                                  </button>
                                </div>
                              </div>
                            ))}
                            
                            <button
                              type="button"
                              onClick={() => {
                                const newSchedule = [...(generatedContent.schedule || [])]
                                let daySchedule = newSchedule.find(s => s.day === day)
                                if (!daySchedule) {
                                  daySchedule = { day, timeSlots: [] }
                                  newSchedule.push(daySchedule)
                                }
                                if (!daySchedule.timeSlots) {
                                  daySchedule.timeSlots = []
                                }
                                daySchedule.timeSlots.push({
                                  startTime: '',
                                  endTime: '',
                                  activity: '',
                                  isService: false
                                })
                                setGeneratedContent({
                                  ...generatedContent,
                                  schedule: newSchedule
                                })
                              }}
                              className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                            >
                              + 時間帯を追加
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="form-label">週単位以外のサービス</label>
                  <textarea
                    value={generatedContent.weeklyServices || ''}
                    onChange={(e) => setGeneratedContent({
                      ...generatedContent,
                      weeklyServices: e.target.value
                    })}
                    className="textarea-field"
                    style={{ resize: 'vertical' }}
                    rows={3}
                    placeholder="月1回のサービス、隔週のサービス、季節行事など"
                  />
                </div>

                <div>
                  <label className="form-label">サービス提供によって実現する生活の全体像</label>
                  <textarea
                    value={generatedContent.lifeOverview || ''}
                    onChange={(e) => setGeneratedContent({
                      ...generatedContent,
                      lifeOverview: e.target.value
                    })}
                    className="textarea-field"
                    style={{ resize: 'vertical' }}
                    rows={4}
                    placeholder="本人が目指す生活の姿、サービス利用による生活の変化・向上など"
                  />
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
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              1. 作成する書類を選択
            </h2>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>📋 書類作成の流れ：</strong><br />
                ① 面談記録から「ニーズ整理票」を作成（アセスメント）<br />
                ② ニーズ整理票を基に「サービス等利用計画」と「週間計画表」を作成<br />
                ③ 計画実施後、「モニタリング報告書」は別途モニタリング管理で作成
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {documentTypes.map((docType) => (
                <button
                  key={docType.id}
                  onClick={() => {
                    setSelectedDocType(docType.id)
                    
                    // 既存の保存された文書があるかチェックして読み込む
                    if (userId) {
                      let existingDocument = null
                      switch (docType.id) {
                        case 'servicePlan':
                          const servicePlans = getServicePlansByUserId(userId)
                          existingDocument = servicePlans.length > 0 ? servicePlans[servicePlans.length - 1] : null
                          break
                        case 'weeklySchedule':
                          const weeklySchedules = getWeeklySchedulesByUserId(userId)
                          existingDocument = weeklySchedules.length > 0 ? weeklySchedules[weeklySchedules.length - 1] : null
                          break
                        case 'needsAssessment':
                          const needsAssessments = getNeedsAssessmentsByUserId(userId)
                          existingDocument = needsAssessments.length > 0 ? needsAssessments[needsAssessments.length - 1] : null
                          break
                      }
                      
                      if (existingDocument) {
                        // 保存されている文書の内容を読み込む
                        setGeneratedContent(existingDocument.content)
                      } else {
                        // 既存の文書がない場合はクリア
                        setGeneratedContent(null)
                      }
                    } else {
                      setGeneratedContent(null)
                    }
                  }}
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

          {/* 生成・作成ボタン */}
          <div className="flex space-x-3">
            <button
              onClick={handleGenerateDocument}
              disabled={!selectedDocType || !interviewText.trim() || isGenerating}
              className={`flex-1 min-h-[44px] flex items-center justify-center font-medium py-3 px-6 rounded-lg transition-colors duration-200 ${
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

            <button
              onClick={handleManualCreate}
              disabled={!selectedDocType || isGenerating}
              className={`flex-1 min-h-[44px] flex items-center justify-center font-medium py-3 px-6 rounded-lg transition-colors duration-200 ${
                !selectedDocType || isGenerating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              <FileText size={20} className="mr-2" />
              手動で作成
            </button>
          </div>
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
                      <p><strong>表現されたニーズ:</strong> {generatedContent.intake?.expressedNeeds}</p>
                      <p><strong>相談員がおさえておきたい情報:</strong> {generatedContent.intake?.counselorNotes}</p>
                      <p><strong>生物的なこと:</strong> {generatedContent.assessment?.biological}</p>
                      <p><strong>心理的なこと:</strong> {generatedContent.assessment?.psychological}</p>
                    </>
                  )}
                  {selectedDocType === 'weeklySchedule' && (
                    <>
                      <p><strong>週単位以外のサービス:</strong> {generatedContent.weeklyServices}</p>
                      <p><strong>生活の全体像:</strong> {generatedContent.lifeOverview}</p>
                      <div className="mt-3">
                        <strong>週間スケジュール（主要活動）:</strong>
                        <div className="mt-2 text-xs">
                          {generatedContent.schedule?.map((daySchedule: any) => (
                            <div key={daySchedule.day} className="mb-1">
                              <span className="font-medium capitalize">
                                {daySchedule.day === 'monday' ? '月曜' : 
                                 daySchedule.day === 'tuesday' ? '火曜' : 
                                 daySchedule.day === 'wednesday' ? '水曜' : 
                                 daySchedule.day === 'thursday' ? '木曜' : 
                                 daySchedule.day === 'friday' ? '金曜' : 
                                 daySchedule.day === 'saturday' ? '土曜' : 
                                 daySchedule.day === 'sunday' ? '日曜' : daySchedule.day}:
                              </span>
                              {daySchedule.timeSlots?.filter((slot: any) => slot.activity).map((slot: any, idx: number) => (
                                <span key={idx} className="ml-2">
                                  {slot.startTime && slot.endTime ? `${slot.startTime}-${slot.endTime} ` : ''}
                                  {slot.activity}
                                  {idx < daySchedule.timeSlots.filter((s: any) => s.activity).length - 1 ? ', ' : ''}
                                </span>
                              ))}
                              {!daySchedule.timeSlots?.some((slot: any) => slot.activity) && (
                                <span className="ml-2 text-gray-500">活動なし</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
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