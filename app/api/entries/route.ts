import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const classCode = searchParams.get('classCode')
  const studentNumber = searchParams.get('studentNumber')

  if (!classCode || !studentNumber) {
    return NextResponse.json({ error: '情報が不足しています' }, { status: 400 })
  }

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('class_code', classCode)
    .eq('student_number', studentNumber)
    .single()

  if (!student) return NextResponse.json({ entries: [] })

  const { data: entries } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('student_id', student.id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ entries: entries || [] })
}
