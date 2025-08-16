// ELYZA 7B instruct統合用クライアント
// 注意: 現在はフロントエンド環境での実装のため、モック版を提供
// 本番環境では、Node.jsサーバーとして分離して実際のllama.cppを使用

export interface LLMConfig {
  modelPath: string;
  nCtx: number;
  nThreads?: number;
  maxTokens: number;
  temperature: number;
  topP: number;
  repeatPenalty: number;
  seed: number;
}

export class LLMClient {
  private config: LLMConfig;
  private isInitialized: boolean = false;

  constructor(config?: Partial<LLMConfig>) {
    const defaultConfig: LLMConfig = {
      modelPath: import.meta.env.VITE_MODEL_PATH || './models/elyza-7b-instruct-q4_0.gguf',
      nCtx: parseInt(import.meta.env.VITE_N_CTX) || 4096,
      nThreads: import.meta.env.VITE_N_THREADS ? parseInt(import.meta.env.VITE_N_THREADS) : navigator.hardwareConcurrency || 4,
      maxTokens: parseInt(import.meta.env.VITE_MAX_TOKENS) || 800,
      temperature: parseFloat(import.meta.env.VITE_TEMP) || 0.4,
      topP: parseFloat(import.meta.env.VITE_TOP_P) || 0.9,
      repeatPenalty: parseFloat(import.meta.env.VITE_REPEAT_PENALTY) || 1.1,
      seed: parseInt(import.meta.env.VITE_SEED) || 42,
    };

    this.config = { ...defaultConfig, ...config };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const startTime = performance.now();
      
      console.log('LLM初期化をシミュレート中...');
      console.log('モデルパス:', this.config.modelPath);
      console.log('設定:', {
        nCtx: this.config.nCtx,
        nThreads: this.config.nThreads,
        maxTokens: this.config.maxTokens,
        temperature: this.config.temperature,
        topP: this.config.topP
      });
      
      // モック初期化遅延
      await new Promise(resolve => setTimeout(resolve, 1000));

      const loadTime = performance.now() - startTime;
      console.log(`モック LLM モデル読み込み完了 (${Math.round(loadTime)}ms)`);
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize LLM:', error);
      throw new Error('LLM初期化に失敗しました');
    }
  }

  async generate(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const startTime = performance.now();
      
      console.log('ELYZA 7B instruct (モック版) で生成中...');
      console.log('システムプロンプト長:', systemPrompt.length);
      console.log('ユーザープロンプト長:', userPrompt.length);
      
      // Llama2 Chat形式のプロンプト構築をログ出力
      const llamaPrompt = `<s>[INST] <<SYS>>
${systemPrompt}
<</SYS>>

${userPrompt} [/INST]`;
      
      console.log('Llama2 Chat形式プロンプト:', llamaPrompt.slice(0, 200) + '...');
      
      // 生成時間のシミュレート
      const generateTime = Math.random() * 3000 + 2000; // 2-5秒
      await new Promise(resolve => setTimeout(resolve, generateTime));

      // モック応答生成（日本語敬体での応答をシミュレート）
      const mockResponse = this.generateMockResponse(userPrompt);
      
      const responseTime = performance.now() - startTime;
      
      console.log(`モックLLM生成完了 (${Math.round(responseTime)}ms), 文字数: ${mockResponse.length}`);
      console.log('生成タイプ: 日本語公的文書敬体');
      console.log('設定値確認: temperature=' + this.config.temperature + ', topP=' + this.config.topP);
      
      return mockResponse;
    } catch (error) {
      console.error('LLM generation failed:', error);
      throw new Error('AI文章生成に失敗しました');
    }
  }

  private generateMockResponse(userPrompt: string): string {
    // 実際のELYZA 7B instructの出力スタイルをシミュレート
    console.log('モックレスポンス生成: 日本語公的文書スタイル');
    
    // JSON形式の応答をシミュレート
    if (userPrompt.includes('ニーズ整理票')) {
      return JSON.stringify({
        intake: {
          expressedNeeds: "利用者様は「自分らしい生活を送りたい」「地域の皆様とのつながりを大切にしたい」とご希望を表明されております。",
          counselorNotes: "日常生活における支援ニーズと社会参加への意欲を確認いたしました。"
        },
        assessment: {
          biological: "基本的な日常生活動作については概ね自立されており、健康管理に留意が必要です。",
          psychological: "前向きな気持ちをお持ちで、新しいことへの挑戦意欲も見受けられます。",
          social: "コミュニケーション能力に長けており、良好な対人関係を築かれております。",
          environment: "ご家族の協力体制が整っており、地域資源の活用も可能な環境です。",
          professionalAssessment: "専門職からの評価では、適切な支援により更なる生活の質の向上が期待されます。",
          supportIssues: "継続的な支援体制の構築と、社会参加機会の拡充が重要な課題です。"
        },
        planning: {
          supportMethods: "利用者様のペースに合わせた段階的な支援を実施し、自立と社会参加を促進してまいります。"
        },
        personSummary: "前向きで協調性があり、適切な支援により更なる成長が期待される方です。"
      }, null, 2);
    }
    
    if (userPrompt.includes('サービス等利用計画')) {
      return JSON.stringify({
        lifeGoals: "利用者様が安心して地域で生活し、ご自身らしい人生を歩まれることを支援いたします。",
        comprehensiveSupport: "利用者様の意向を最大限尊重し、段階的かつ継続的な支援を提供いたします。",
        longTermGoals: "1年後の社会参加と生活の質の向上を目指します。",
        shortTermGoals: "3か月後の生活リズムの安定化を図ります。",
        services: [{
          priority: 1,
          issueToSolve: "日常生活における支援ニーズ",
          supportGoal: "自立した生活の実現",
          completionPeriod: "6か月",
          serviceType: "生活介護",
          serviceDetails: "週3回、1日6時間のサービス提供",
          providerName: "地域生活支援センター",
          userRole: "積極的なサービス参加",
          evaluationPeriod: "月1回",
          otherNotes: "利用者様のペースに配慮した支援"
        }]
      }, null, 2);
    }
    
    // その他のケース
    return '{"response": "申し訳ございませんが、適切な応答を生成できませんでした。（該当なし）"}';
  }

  async generateDocumentDraft(
    documentType: string,
    templateData: Record<string, any>,
    userInput: Record<string, any>
  ): Promise<string> {
    const systemPrompt = `公的文書の日本語敬体で、簡潔・明瞭・事実ベースの文章を作成してください。
以下の原則を厳守してください：
- 推測は避け、入力に含まれる範囲のみ記載
- 差別的・不適切な語句は使用しない
- 見出し順序は変更しない
- 空欄には「（該当なし）」と明示
- 丁寧語・尊敬語を適切に使用
- 障害福祉サービスの専門用語を正確に使用`;

    const userPrompt = `文書種別: ${documentType}

入力データ:
${JSON.stringify(userInput, null, 2)}

テンプレート情報:
${JSON.stringify(templateData, null, 2)}

上記の情報を基に、適切な公的文書として整理してください。`;

    return await this.generate(systemPrompt, userPrompt);
  }

  getStatus(): { initialized: boolean; config: LLMConfig } {
    return {
      initialized: this.isInitialized,
      config: this.config,
    };
  }
}

export const llmClient = new LLMClient();