import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAIComment } from '@/lib/gemini'

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

  // AIコメント生成
  const aiComment = await getAIComment(content)

  // 日記を保存
  const wordCount = content.trim().split(/\s+/).length
  const sentenceCount = (content.match(/[.!?]/g) || []).length || 1

  const { data: entry, error } = await supabase
    .from('diary_entries')
    .insert({
      student_id: student.id,
      content,
      ai_comment: aiComment,
      word_count: wordCount,
      sentence_count: sentenceCount,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 })

  return NextResponse.json({ entry, aiComment })
}
