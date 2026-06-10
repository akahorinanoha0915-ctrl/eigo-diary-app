import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function getAIComment(diaryContent: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `あなたは小学生の英語日記に返事をする優しい外国人の先生「Ms. Sunny」です。
以下のルールで返事を書いてください：
- 間違いを直接指摘しない（書く意欲を守る）
- 書いてくれたことを明るく褒める
- さりげなく正しい英語を自然に使って返す
- 返事は英語2文＋最後に日本語で一言（20文字以内）
- 絵文字を1〜2個使って親しみやすく

児童の日記：
${diaryContent}`

  const result = await model.generateContent(prompt)
  return result.response.text()
}
