import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const classCode = searchParams.get('classCode')
  const studentNumber = searchParams.get('studentNumber')

  if (!classCode || !studentNumber) {
    return NextResponse.json({ vocabulary: [] })
  }

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('class_code', classCode)
    .eq('student_number', studentNumber)
    .single()

  if (!student) return NextResponse.json({ vocabulary: [] })

  const { data: vocabulary } = await supabase
    .from('vocabulary')
    .select('word, meaning_ja, example, created_at')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ vocabulary: vocabulary || [] })
}
