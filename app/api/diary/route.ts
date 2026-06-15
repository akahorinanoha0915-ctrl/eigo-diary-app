import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAIResponse, extractVocabulary } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  const { classCode, studentNumber, content } = await req.json()

  if (!classCode || !studentNumber || !content) {
    return NextResponse.json({ error: '入力が不足しています' }, { status: 400 })
  }

  // 児童を取得（なければ作成）
  let { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('class_code', classCode)
    .eq('student_number', studentNumber)
    .single()

  if (!student) {
    const { data: newStudent, error } = await supabase
      .from('students')
      .insert({ class_code: classCode, student_number: studentNumber })
      .select('id')
      .single()
    if (error) return NextResponse.json({ error: '児童の登録に失敗しました' }, { status: 500 })
    student = newStudent
  }

  // AIコメント生成＆単語抽出（並列）
  const [aiResult, vocabWords] = await Promise.all([
    getAIResponse(content).catch(() => ({
      comment: 'Great job writing today! Keep it up! 🌟\nよく書けました！',
      grammarNote: null,
      todayWord: { word: 'wonderful', meaning_ja: '素晴らしい', example: 'It was wonderful!' },
    })),
    extractVocabulary(content).catch(() => []),
  ])

  const { comment: aiComment, grammarNote, todayWord } = aiResult

  // 日記を保存
  const wordCount = content.trim().split(/\s+/).length
  const sentenceCount = (content.match(/[.!?]/g) || []).length || 1

  const { data: entry, error } = await supabase
    .from('diary_entries')
    .insert({
      student_id: student!.id,
      content,
      ai_comment: aiComment,
      word_count: wordCount,
      sentence_count: sentenceCount,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 })

  // 単語帳に保存
  const allWords = [
    ...vocabWords,
    ...(todayWord.word ? [todayWord] : []),
  ]
  const uniqueWords = allWords.filter(
    (w, i, arr) => w.word && arr.findIndex(x => x.word === w.word) === i
  )

  if (uniqueWords.length > 0) {
    const { error: vocabError } = await supabase.from('vocabulary').upsert(
      uniqueWords.map(v => ({
        student_id: student!.id,
        word: v.word,
        meaning_ja: v.meaning_ja,
        example: v.example,
        diary_entry_id: entry.id,
      })),
      { onConflict: 'student_id,word', ignoreDuplicates: true }
    )
    if (vocabError) console.error('Vocab save error:', vocabError)
  }

  return NextResponse.json({ entry, aiComment, grammarNote, todayWord, vocabWords })
}
