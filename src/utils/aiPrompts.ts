// AI生成用プロンプトテンプレート
export const AI_PROMPTS = {
  servicePlan: {
    systemPrompt: `あなたは障害福祉サービスの相談支援専門員です。
利用者の面談記録から「サービス等利用計画」を作成してください。

以下の項目を含む計画を作成してください：
1. 利用者及びその家族の生活に対する意向（希望する生活）
2. 総合的な援助の方針
3. 長期目標（6か月から1年程度）
4. 短期目標（1か月から3か月程度）
5. 具体的なサービス内容（優先順位付き）

サービス内容には以下を含めてください：
- 解決すべき課題（本人のニーズ）
- 支援目標
- 達成時期
- 福祉サービス等の種類
- 種類・内容・量・頻度・時間
- 提供事業所名
- 課題解決のための本人の役割
- 評価時期
- その他留意事項

専門的で具体的、かつ利用者中心の内容にしてください。`,
    
    userPrompt: (interviewText: string, userInfo: any) => `
利用者情報：
- 氏名：${userInfo.actualName}
- 障害種別：${userInfo.disabilityType}
- 障害支援区分：${userInfo.disabilitySupportCategory}

面談記録：
${interviewText}

上記の情報を基に、JSON形式で以下の構造のサービス等利用計画を作成してください：
{
  "lifeGoals": "利用者及びその家族の生活に対する意向",
  "comprehensiveSupport": "総合的な援助の方針",
  "longTermGoals": "長期目標",
  "shortTermGoals": "短期目標",
  "services": [
    {
      "priority": 1,
      "issueToSolve": "解決すべき課題",
      "supportGoal": "支援目標",
      "completionPeriod": "達成時期",
      "serviceType": "福祉サービス等",
      "serviceDetails": "種類・内容・量・頻度・時間",
      "providerName": "提供事業所名",
      "userRole": "課題解決のための本人の役割",
      "evaluationPeriod": "評価時期",
      "otherNotes": "その他留意事項"
    }
  ]
}`
  },

  weeklySchedule: {
    systemPrompt: `あなたは障害福祉サービスの相談支援専門員です。
利用者の面談記録から「週間計画表」を作成してください。

以下の項目を含む計画表を作成してください：
1. 月曜日から日曜日までの日中活動スケジュール
2. 週単位以外のサービス（月1回、隔週など）
3. サービス提供によって実現する生活の全体像

時間は6:00-22:00、0:00-4:00の範囲で設定し、
実現可能で具体的なスケジュールにしてください。`,

    userPrompt: (interviewText: string, userInfo: any) => `
利用者情報：
- 氏名：${userInfo.actualName}
- 障害種別：${userInfo.disabilityType}
- 障害支援区分：${userInfo.disabilitySupportCategory}

面談記録：
${interviewText}

上記の情報を基に、JSON形式で以下の構造の週間計画表を作成してください：
{
  "schedule": [
    {
      "day": "monday",
      "timeSlots": [
        {
          "startTime": "09:00",
          "endTime": "15:00",
          "activity": "生活介護サービス",
          "isService": true
        }
      ]
    }
  ],
  "weeklyServices": "週単位以外のサービス",
  "lifeOverview": "サービス提供によって実現する生活の全体像"
}`
  },

  needsAssessment: {
    systemPrompt: `あなたは障害福祉サービスの相談支援専門員です。
利用者の面談記録から「ニーズ整理票」を作成してください。

以下の項目を含む整理票を作成してください：
1. インテーク：情報の整理、本人が表現している希望・解決したい課題
2. アセスメント：生活的なこと、心理的なこと、社会性・対人関係の特徴
3. プランニング：支援目標、対応・方針

専門的な視点で包括的にアセスメントしてください。`,

    userPrompt: (interviewText: string, userInfo: any) => `
利用者情報：
- 氏名：${userInfo.actualName}
- 障害種別：${userInfo.disabilityType}
- 障害支援区分：${userInfo.disabilitySupportCategory}

面談記録：
${interviewText}

上記の情報を基に、JSON形式で以下の構造のニーズ整理票を作成してください：
{
  "intake": {
    "basicInfo": "基本情報の整理",
    "expressedNeeds": "本人が表現している希望・解決したい課題"
  },
  "assessment": {
    "livingConditions": "生活的なこと",
    "psychologicalConditions": "心理的なこと", 
    "socialConditions": "社会性・対人関係の特徴"
  },
  "planning": {
    "supportGoals": "支援目標",
    "supportMethods": "対応・方針"
  }
}`
  },

  monitoringReport: {
    systemPrompt: `あなたは障害福祉サービスの相談支援専門員です。
利用者の面談記録から「モニタリング報告書」を作成してください。

以下の項目を含む報告書を作成してください：
1. 総合的な援助の方針
2. 全体の状況
3. 各支援目標に対するモニタリング項目：
   - 支援目標
   - 達成時期
   - サービス提供状況
   - 本人の感想・満足度
   - 支援目標の達成度（ニーズの充足度）
   - 今後の課題・解決方法
   - 計画変更の必要性
   - その他留意事項

客観的で建設的な評価を行ってください。`,

    userPrompt: (interviewText: string, userInfo: any) => `
利用者情報：
- 氏名：${userInfo.actualName}
- 障害種別：${userInfo.disabilityType}
- 障害支援区分：${userInfo.disabilitySupportCategory}

面談記録：
${interviewText}

上記の情報を基に、JSON形式で以下の構造のモニタリング報告書を作成してください：
{
  "comprehensiveSupport": "総合的な援助の方針",
  "overallStatus": "全体の状況",
  "monitoringItems": [
    {
      "priority": 1,
      "supportGoal": "支援目標",
      "completionPeriod": "達成時期",
      "serviceStatus": "サービス提供状況",
      "userSatisfaction": "本人の感想・満足度",
      "goalAchievement": "支援目標の達成度",
      "currentIssues": "今後の課題・解決方法",
      "planChanges": {
        "serviceChange": false,
        "serviceContent": false,
        "planModification": false
      },
      "otherNotes": "その他留意事項"
    }
  ]
}`
  }
}

// AI APIを呼び出す関数（実装時にはOllamaやローカルLLMに接続）
export const generateDocumentWithAI = async (
  documentType: keyof typeof AI_PROMPTS,
  interviewText: string,
  userInfo: any
): Promise<any> => {
  const prompt = AI_PROMPTS[documentType]
  
  // 実際の実装では、ここでローカルAI（Ollamaなど）を呼び出す
  // 現在はモック実装
  console.log('AI生成中...', {
    systemPrompt: prompt.systemPrompt,
    userPrompt: prompt.userPrompt(interviewText, userInfo)
  })

  // モック応答（実際の実装では削除）
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  return generateMockResponse(documentType, userInfo)
}

// モック応答生成（実際の実装では不要）
const generateMockResponse = (documentType: string, userInfo: any) => {
  switch (documentType) {
    case 'servicePlan':
      return {
        lifeGoals: `${userInfo.actualName}さんが自分らしく安心して生活できるよう支援し、地域社会への参加を促進したい`,
        comprehensiveSupport: '本人の意向を尊重し、段階的な支援により自立した生活の実現を目指す',
        longTermGoals: '1年後に就労継続支援事業での定期利用を通じて社会参加を果たす',
        shortTermGoals: '3か月後に生活リズムを整え、対人関係スキルを向上させる',
        services: [
          {
            priority: 1,
            issueToSolve: '日常生活リズムの改善',
            supportGoal: '規則正しい生活習慣の確立',
            completionPeriod: '3か月',
            serviceType: '生活介護',
            serviceDetails: '週3回、1日6時間の日中活動',
            providerName: '地域生活支援センター',
            userRole: '毎日の生活記録をつける',
            evaluationPeriod: '月1回',
            otherNotes: '体調管理と服薬管理に注意'
          }
        ]
      }

    case 'weeklySchedule':
      return {
        schedule: [
          {
            day: 'monday',
            timeSlots: [
              { startTime: '09:00', endTime: '15:00', activity: '生活介護サービス', isService: true }
            ]
          },
          {
            day: 'tuesday', 
            timeSlots: [
              { startTime: '10:00', endTime: '12:00', activity: '医療機関受診', isService: false }
            ]
          }
        ],
        weeklyServices: '月1回の相談支援、3か月に1回のモニタリング',
        lifeOverview: 'サービス利用により規則正しい生活リズムを構築し、段階的な社会参加を実現する'
      }

    case 'needsAssessment':
      return {
        intake: {
          basicInfo: `${userInfo.disabilityType}のある${userInfo.actualName}さん、家族と同居中`,
          expressedNeeds: '自立した生活を送り、働くことを希望している'
        },
        assessment: {
          livingConditions: '基本的な生活スキルは習得しているが、生活リズムに課題',
          psychologicalConditions: '新しい環境や変化に不安を感じやすい傾向',
          socialConditions: 'コミュニケーションに困難があるが、人との関わりを求めている'
        },
        planning: {
          supportGoals: '段階的な社会参加と就労準備支援',
          supportMethods: '日中活動サービスを活用した生活リズムの定着と対人スキルの向上'
        }
      }

    case 'monitoringReport':
      return {
        comprehensiveSupport: '本人の意向を尊重した段階的支援により、着実な改善が見られている',
        overallStatus: 'サービス利用により生活の質が向上し、本人・家族ともに満足度が高い',
        monitoringItems: [
          {
            priority: 1,
            supportGoal: '生活リズムの改善',
            completionPeriod: '3か月',
            serviceStatus: '週3回の定期利用が定着している',
            userSatisfaction: '満足している。スタッフとの関係も良好',
            goalAchievement: '80% - 大幅な改善が見られる',
            currentIssues: '天候による通所への影響があり、対策が必要',
            planChanges: {
              serviceChange: false,
              serviceContent: false, 
              planModification: false
            },
            otherNotes: '継続的な支援により更なる改善が期待される'
          }
        ]
      }

    default:
      return null
  }
}