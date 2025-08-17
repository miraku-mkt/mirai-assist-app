// 純粋AI統合クライアント - gemma2:2b モデル
// モック機能完全削除版

export interface LLMConfig {
  apiBaseUrl: string;
  model: string;
}

export class LLMClient {
  private config: LLMConfig;

  constructor(config?: Partial<LLMConfig>) {
    this.config = {
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3006',
      model: 'gemma2:2b',
      ...config
    };
  }

  async initialize(): Promise<void> {
    console.log('AI クライアント初期化完了');
    console.log('使用モデル:', this.config.model);
    console.log('API URL:', this.config.apiBaseUrl);
  }

  async generate(systemPrompt: string, userPrompt: string): Promise<string> {
    console.log('真のAI生成開始:', this.config.model);
    console.log('システムプロンプト長:', systemPrompt.length);
    console.log('ユーザープロンプト長:', userPrompt.length);
    
    const response = await fetch(`${this.config.apiBaseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemPrompt,
        userPrompt
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`AI生成エラー: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.response;
    
    console.log(`AI生成完了: ${aiResponse.length}文字`);
    console.log('使用モデル:', data.model);
    console.log('AI生成結果（先頭500文字）:', aiResponse.slice(0, 500));
    
    return aiResponse;
  }

  async generateDocumentDraft(
    documentType: string,
    templateData: Record<string, any>,
    userInput: Record<string, any>
  ): Promise<string> {
    try {
      const { AI_PROMPTS } = await import('../utils/aiPrompts');
      
      console.log('専門プロンプト使用:', documentType);

      const promptConfig = AI_PROMPTS[documentType as keyof typeof AI_PROMPTS];
      
      if (!promptConfig) {
        throw new Error(`対応していない書類タイプ: ${documentType}`);
      }

      const systemPrompt = promptConfig.systemPrompt;
      const interviewText = userInput.interviewText || '';
      const userInfo = userInput.userInfo || templateData.userInfo || {};
      const userPrompt = promptConfig.userPrompt(interviewText, userInfo);

      console.log('書類生成開始:', {
        documentType,
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length,
        userInfo: userInfo.actualName
      });

      const aiResult = await this.generate(systemPrompt, userPrompt);
      
      console.log('AI生成結果をJSONパース中...');
      try {
        const parsedResult = JSON.parse(aiResult);
        console.log('JSONパース成功:', Object.keys(parsedResult));
        return parsedResult;
      } catch (parseError) {
        console.error('JSONパースエラー:', parseError);
        console.error('パース対象文字列:', aiResult);
        throw new Error(`AI生成結果のJSONパースに失敗しました: ${parseError.message}`);
      }
      
    } catch (error) {
      console.error('専門プロンプト生成エラー:', error);
      throw error;
    }
  }

  getStatus(): { initialized: boolean; config: LLMConfig } {
    return {
      initialized: true,
      config: this.config,
    };
  }
}

export const llmClient = new LLMClient();