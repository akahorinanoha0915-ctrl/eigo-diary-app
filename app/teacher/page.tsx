'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type StudentSummary = {
  student_number: number
  entry_count: number
  total_words: number
  latest_entry: string
  latest_date: string
}

export default function TeacherPage() {
  const [classCode, setClassCode] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [students, setStudents] = useState<StudentSummary[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)

  const loadClass = async () => {
    if (!classCode) return

    const { data: studentRows } = await supabase
      .from('students')
      .select('id, student_number')
      .eq('class_code', classCode)
      .order('student_number')

    if (!studentRows) return

    const summaries: StudentSummary[] = []
    for (const s of studentRows) {
      const { data: entryRows } = await supabase
        .from('diary_entries')
        .select('content, word_count, created_at')
        .eq('student_id', s.id)
        .order('created_at', { ascending: false })

      const entries = entryRows || []
      summaries.push({
        student_number: s.student_number,
        entry_count: entries.length,
        total_words: entries.reduce((sum, e) => sum + (e.word_count || 0), 0),
        latest_entry: entries[0]?.content || '（まだ書いていません）',
        latest_date: entries[0]?.created_at
          ? new Date(entries[0].created_at).toLocaleDateString('ja-JP')
          : '-',
      })
    }
    setStudents(summaries)
    setLoaded(true)
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">👩‍🏫 先生用ダッシュボード</h1>
        <p className="text-sm text-gray-500 mb-6">クラスの英語日記の進捗を確認できます</p>

        <div className="flex gap-2 mb-6">
          <input
            className="border-2 border-gray-200 rounded-xl px-4 py-2 flex-1 focus:outline-none focus:border-sky-400"
            placeholder="クラスコードを入力（例：5A）"
            value={classCode}
            onChange={e => setClassCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && loadClass()}
          />
          <button
            onClick={loadClass}
            className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-2 rounded-xl transition"
          >
            表示
          </button>
        </div>

        {loaded && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-2xl shadow p-4 text-center">
                <p className="text-3xl font-bold text-sky-600">{students.length}</p>
                <p className="text-sm text-gray-500">登録済み児童</p>
              </div>
              <div className="bg-white rounded-2xl shadow p-4 text-center">
                <p className="text-3xl font-bold text-green-600">
                  {students.filter(s => s.entry_count > 0).length}
                </p>
                <p className="text-sm text-gray-500">日記提出済み</p>
              </div>
              <div className="bg-white rounded-2xl shadow p-4 text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {students.reduce((sum, s) => sum + s.total_words, 0)}
                </p>
                <p className="text-sm text-gray-500">クラス合計単語</p>
              </div>
            </div>

            <div className="space-y-3">
              {students.map(s => (
                <div key={s.student_number} className="bg-white rounded-2xl shadow overflow-hidden">
                  <div
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => setExpanded(expanded === s.student_number ? null : s.student_number)}
                  >
                    <span className="font-bold text-gray-700 w-12">{s.student_number}番</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      s.entry_count === 0 ? 'bg-red-100 text-red-600' :
                      s.entry_count < 3 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {s.entry_count}回
                    </span>
                    <span className="text-sm text-gray-500">{s.total_words}語</span>
                    <span className="flex-1 text-sm text-gray-600 truncate">{s.latest_entry}</span>
                    <span className="text-xs text-gray-400 shrink-0">{s.latest_date}</span>
                    <span className="text-gray-400 text-sm">{expanded === s.student_number ? '▲' : '▼'}</span>
                  </div>
                  {expanded === s.student_number && s.latest_entry !== '（まだ書いていません）' && (
                    <div className="px-5 pb-4 border-t bg-sky-50">
                      <p className="text-xs text-gray-400 mt-3 mb-1">最新の日記（全文）</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{s.latest_entry}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
