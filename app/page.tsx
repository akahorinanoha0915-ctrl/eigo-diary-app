'use client'
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

type Entry = {
  id: string
  content: string
  ai_comment: string
  word_count: number
  sentence_count: number
  created_at: string
}

type VocabWord = {
  word: string
  meaning_ja: string
  example: string
  created_at: string
}

export default function Home() {
  const [classCode, setClassCode] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [content, setContent] = useState('')
  const [entries, setEntries] = useState<Entry[]>([])
  const [vocabulary, setVocabulary] = useState<VocabWord[]>([])
  const [aiComment, setAiComment] = useState('')
  const [newWords, setNewWords] = useState<VocabWord[]>([])
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'diary' | 'history' | 'vocab'>('diary')

  const login = () => {
    if (classCode && studentNumber) {
      setLoggedIn(true)
      fetchEntries()
      fetchVocabulary()
    }
  }

  const fetchEntries = async () => {
    const res = await fetch(`/api/entries?classCode=${classCode}&studentNumber=${studentNumber}`)
    const data = await res.json()
    setEntries(data.entries || [])
  }

  const fetchVocabulary = async () => {
    const res = await fetch(`/api/vocabulary?classCode=${classCode}&studentNumber=${studentNumber}`)
    const data = await res.json()
    setVocabulary(data.vocabulary || [])
  }

  const submitDiary = async () => {
    if (!content.trim()) return
    setLoading(true)
    setAiComment('')
    setNewWords([])
    const res = await fetch('/api/diary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classCode, studentNumber, content }),
    })
    const data = await res.json()
    if (data.aiComment) {
      setAiComment(data.aiComment)
      setNewWords(data.vocabWords || [])
      setContent('')
      fetchEntries()
      fetchVocabulary()
    }
    setLoading(false)
  }

  const chartData = entries.map((e, i) => ({
    回: i + 1,
    単語数: e.word_count,
  }))

  if (!loggedIn) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-sky-100 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center text-sky-600 mb-2">🌟 英語日記アプリ</h1>
          <p className="text-center text-gray-500 text-sm mb-6">English Diary</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">クラスコード</label>
              <input
                className="w-full border-2 border-sky-200 rounded-xl px-4 py-2 focus:outline-none focus:border-sky-400"
                placeholder="例：5A"
                value={classCode}
                onChange={e => setClassCode(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">出席番号</label>
              <input
                type="number"
                className="w-full border-2 border-sky-200 rounded-xl px-4 py-2 focus:outline-none focus:border-sky-400"
                placeholder="例：12"
                value={studentNumber}
                onChange={e => setStudentNumber(e.target.value)}
              />
            </div>
            <button
              onClick={login}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-xl transition"
            >
              はじめる！
            </button>
            <a href="/teacher" className="block text-center text-xs text-gray-400 mt-2 hover:text-gray-600">
              先生用ページ →
            </a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 to-white p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-sky-600">🌟 英語日記</h1>
          <span className="text-sm text-gray-500">{classCode} - {studentNumber}番</span>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setView('diary')}
            className={`flex-1 py-2 rounded-xl font-medium text-sm transition ${view === 'diary' ? 'bg-sky-500 text-white' : 'bg-white text-gray-500'}`}
          >
            ✏️ 日記
          </button>
          <button
            onClick={() => setView('vocab')}
            className={`flex-1 py-2 rounded-xl font-medium text-sm transition ${view === 'vocab' ? 'bg-green-500 text-white' : 'bg-white text-gray-500'}`}
          >
            📖 単語帳
          </button>
          <button
            onClick={() => setView('history')}
            className={`flex-1 py-2 rounded-xl font-medium text-sm transition ${view === 'history' ? 'bg-sky-500 text-white' : 'bg-white text-gray-500'}`}
          >
            📈 成長
          </button>
        </div>

        {view === 'diary' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                今日の英語日記を書こう！✨
              </label>
              <textarea
                className="w-full border-2 border-sky-200 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-400 min-h-[120px] text-base"
                placeholder="Today I..."
                value={content}
                onChange={e => setContent(e.target.value)}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-400">{content.trim().split(/\s+/).filter(Boolean).length} words</span>
                <button
                  onClick={submitDiary}
                  disabled={loading || !content.trim()}
                  className="bg-sky-500 hover:bg-sky-600 disabled:bg-gray-300 text-white font-bold px-6 py-2 rounded-xl transition"
                >
                  {loading ? '送信中...' : '送る！'}
                </button>
              </div>
            </div>

            {aiComment && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4">
                <p className="text-sm font-bold text-yellow-700 mb-1">👩‍🏫 Ms. Sunny より</p>
                <p className="text-sm whitespace-pre-wrap">{aiComment}</p>
              </div>
            )}

            {newWords.length > 0 && (
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4">
                <p className="text-sm font-bold text-green-700 mb-2">📖 今日の新しい単語！</p>
                <div className="space-y-2">
                  {newWords.map((w, i) => (
                    <div key={i} className="bg-white rounded-xl px-3 py-2">
                      <span className="font-bold text-green-600">{w.word}</span>
                      <span className="text-gray-500 text-sm ml-2">= {w.meaning_ja}</span>
                      <p className="text-xs text-gray-400 mt-0.5">{w.example}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {entries.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-4">
                <p className="text-sm font-bold text-gray-600 mb-2">📚 最近の日記</p>
                {entries.slice(-3).reverse().map(e => (
                  <div key={e.id} className="border-b last:border-0 py-2">
                    <p className="text-xs text-gray-400">{new Date(e.created_at).toLocaleDateString('ja-JP')}</p>
                    <p className="text-sm">{e.content}</p>
                    <p className="text-xs text-sky-500 mt-1">{e.ai_comment?.split('\n')[0]}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'vocab' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-600">📖 わたしの単語帳</p>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                  {vocabulary.length} 語
                </span>
              </div>
              {vocabulary.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">
                  日記を書くと単語が自動で追加されるよ！
                </p>
              ) : (
                <div className="space-y-2">
                  {vocabulary.map((w, i) => (
                    <div key={i} className="border rounded-xl px-3 py-2 hover:bg-green-50 transition">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-green-600 text-base">{w.word}</span>
                        <span className="text-gray-500 text-sm">{w.meaning_ja}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 italic">{w.example}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow p-4">
              <p className="text-sm font-bold text-gray-600 mb-1">📊 書いた単語数の変化</p>
              <p className="text-xs text-gray-400 mb-3">続けるほど増えていくよ！</p>
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="回" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="単語数" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-400 py-8 text-sm">日記を2回以上書くとグラフが出るよ！</p>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow p-4">
              <p className="text-sm font-bold text-gray-600 mb-2">🏆 これまでの記録</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-sky-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-sky-600">{entries.length}</p>
                  <p className="text-xs text-gray-500">回書いた</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-green-600">
                    {vocabulary.length}
                  </p>
                  <p className="text-xs text-gray-500">単語を習得</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-yellow-600">
                    {entries.length > 0 ? Math.max(...entries.map(e => e.word_count)) : 0}
                  </p>
                  <p className="text-xs text-gray-500">最高単語数</p>
                </div>
              </div>
            </div>

            {entries.length >= 2 && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4">
                <p className="text-sm font-bold text-purple-700">🌱 成長してるね！</p>
                <p className="text-sm text-purple-600 mt-1">
                  最初は {entries[0].word_count} 単語 → 最新は {entries[entries.length - 1].word_count} 単語！
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
