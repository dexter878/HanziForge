import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAudio } from '../components/AudioButton'
import { TONE_GUIDE, PINYIN_LESSONS } from '../data/pinyinLessons'
import {
    LESSON_QUIZZES, CONFUSABLE_GROUPS, TONE_PAIRS,
    SPEAKING_CATEGORIES, ALL_SPEAKING_ITEMS
} from '../data/pinyinQuiz'
import { trackProgress } from '../services/progress'
import { useAuth } from '../contexts/AuthContext'

/* ========== UTILS ========== */

const TRAINER_BASES = ['ma', 'ba', 'ni', 'hao', 'shi', 'li', 'xue', 'zhong', 'ren', 'you',
    'da', 'ta', 'ge', 'ke', 'he', 'ji', 'qi', 'xi', 'wo', 'de']
const TONE_OPTIONS = [1, 2, 3, 4]

function randomFrom(values) {
    return values[Math.floor(Math.random() * values.length)]
}

function shuffle(arr) {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

function normalizeLessonId(rawLessonId) {
    if (!rawLessonId) return rawLessonId
    const match = /^lesson_(\d+)$/.exec(rawLessonId)
    if (match) return `lesson-${match[1]}`
    return rawLessonId
}

function lessonUrl(lessonId) {
    return `/пиньинь/${lessonId.replace('lesson-', 'lesson_')}`
}

function normalizeSpokenText(value) {
    if (!value) return ''
    return String(value).replace(/\s+/g, '').replace(/[，。！？,.!?]/g, '').trim()
}

/* ========== SVG Tone Contour ========== */

function ToneContour({ tone, size = 48, color = 'currentColor' }) {
    const paths = {
        1: 'M 4 12 L 44 12',           // flat high
        2: 'M 4 36 Q 24 20 44 8',      // rising
        3: 'M 4 16 Q 14 40 24 36 Q 34 32 44 20', // dip-rise
        4: 'M 4 8 Q 24 24 44 40',      // falling
        5: 'M 4 24 L 44 24',           // neutral short
    }
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d={paths[tone] || paths[1]} stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
    )
}

/* ========== TAB NAVIGATION ========== */

const TABS = [
    { key: 'lessons', label: '📚 Уроки', icon: '📚' },
    { key: 'tones', label: '🎵 Тоны', icon: '🎵' },
    { key: 'confusion', label: '🔀 Похожие', icon: '🔀' },
    { key: 'speaking', label: '🎙️ Говорение', icon: '🎙️' },
    { key: 'teacher', label: '🎤 Преподаватель', icon: '🎤' },
]

function TabBar({ activeTab, setActiveTab }) {
    return (
        <div className="flex gap-1 p-1 rounded-xl bg-dark-card border border-dark-border">
            {TABS.map(tab => (
                <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                        : 'text-dark-muted hover:text-white hover:bg-dark-bg'
                        }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    )
}

/* ========== TONE GUIDE (enhanced) ========== */

function ToneGuide() {
    const { playPinyin } = useAudio()

    return (
        <div className="card space-y-4">
            <h2 className="text-lg font-semibold">🎵 Введение в тоны</h2>
            <p className="text-sm text-dark-muted">
                В мандаринском китайском 4 основных тона + нейтральный. Тон меняет значение слова полностью!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {TONE_GUIDE.map((tone) => (
                    <button
                        key={tone.tone}
                        onClick={() => playPinyin(tone.sample)}
                        className="p-4 rounded-xl bg-dark-bg border border-dark-border hover:border-primary-500/60 transition-all text-left group"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-lg font-bold text-primary-400">{tone.name}</div>
                            <ToneContour tone={tone.tone} size={40} color="#818cf8" />
                        </div>
                        <div className="text-xs text-dark-muted">Контур: {tone.contour}</div>
                        <div className="text-sm mt-2">{tone.description}</div>
                        <div className="mt-2 text-xs text-primary-400 group-hover:text-primary-300">
                            🔊 {tone.sample} — нажмите
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}

/* ========== TONAL MINIMAL PAIRS ========== */

function TonalPairs() {
    const { playPinyin } = useAudio()

    return (
        <div className="card space-y-4">
            <h2 className="text-lg font-semibold">🔤 Минимальные тоновые пары</h2>
            <p className="text-sm text-dark-muted">
                Один и тот же слог с разными тонами — совершенно разные слова. Нажмите, чтобы услышать разницу.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TONE_PAIRS.map((pair) => (
                    <div key={pair.base} className="p-4 rounded-xl bg-dark-bg border border-dark-border">
                        <div className="text-lg font-bold text-primary-400 mb-3">{pair.base}</div>
                        <div className="grid grid-cols-2 gap-2">
                            {[1, 2, 3, 4].map(t => {
                                const info = pair.meaning[t]
                                if (!info) return null
                                return (
                                    <button
                                        key={t}
                                        onClick={() => playPinyin(`${pair.base}${t}`)}
                                        className="flex items-center gap-2 p-2 rounded-lg bg-dark-card border border-dark-border hover:border-primary-500/60 transition-all text-left text-sm"
                                    >
                                        <ToneContour tone={t} size={28} color="#818cf8" />
                                        <div>
                                            <div className="font-medium">Тон {t}</div>
                                            <div className="text-xs text-dark-muted">{info}</div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ========== TONE TRAINER (enhanced) ========== */

function ToneTrainer() {
    const { isPlaying, playPinyin } = useAudio()
    const [base, setBase] = useState(() => randomFrom(TRAINER_BASES))
    const [correctTone, setCorrectTone] = useState(() => randomFrom(TONE_OPTIONS))
    const [result, setResult] = useState(null)
    const [score, setScore] = useState({ correct: 0, total: 0 })
    const [streak, setStreak] = useState(0)

    const token = `${base}${correctTone}`

    const playCurrent = () => playPinyin(token)

    const chooseTone = async (tone) => {
        if (result !== null) return
        const ok = tone === correctTone
        setResult({ selected: tone, correct: correctTone, ok })
        setScore(s => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }))
        setStreak(s => ok ? s + 1 : 0)
        await trackProgress('pinyin', `tone:${token}`, ok)
    }

    const nextRound = () => {
        setResult(null)
        setBase(randomFrom(TRAINER_BASES))
        setCorrectTone(randomFrom(TONE_OPTIONS))
    }

    return (
        <div className="card space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-lg font-semibold">🎧 Тренажёр тонов</h2>
                <div className="flex items-center gap-4 text-sm">
                    {streak >= 3 && <span className="text-yellow-400">🔥 {streak} подряд!</span>}
                    <span className="text-dark-muted">
                        Счёт: <span className="text-green-500 font-semibold">{score.correct}</span>/{score.total}
                        {score.total > 0 && <span className="ml-1 text-xs">({Math.round(score.correct / score.total * 100)}%)</span>}
                    </span>
                </div>
            </div>

            <p className="text-sm text-dark-muted">
                Послушайте слог и определите тон. Чем больше ответов подряд — тем лучше!
            </p>

            <div className="flex items-center gap-3">
                <button onClick={playCurrent} className="btn btn-primary text-lg px-6 py-3">
                    {isPlaying ? '🔊 Играет...' : '▶ Слушать'}
                </button>
                <div className="text-dark-muted">Слог: <span className="font-semibold text-white">{base}</span> + ?</div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TONE_OPTIONS.map((tone) => {
                    const isSelected = result?.selected === tone
                    const isCorrectTone = result?.correct === tone
                    const isWrongChoice = result && isSelected && !result.ok

                    let cls = 'p-4 rounded-xl border-2 transition-all cursor-pointer text-center '
                    if (result === null) {
                        cls += 'border-dark-border bg-dark-bg hover:border-primary-500/60 hover:bg-dark-card'
                    } else if (isCorrectTone) {
                        cls += 'border-green-500 bg-green-500/20 text-green-400'
                    } else if (isWrongChoice) {
                        cls += 'border-red-500 bg-red-500/20 text-red-400'
                    } else {
                        cls += 'border-dark-border bg-dark-bg opacity-50'
                    }

                    return (
                        <button key={tone} onClick={() => chooseTone(tone)} className={cls}>
                            <ToneContour tone={tone} size={36} color={isCorrectTone ? '#22c55e' : isWrongChoice ? '#ef4444' : '#818cf8'} />
                            <div className="font-semibold mt-1">Тон {tone}</div>
                        </button>
                    )
                })}
            </div>

            {result && (
                <div className={`rounded-xl p-4 flex items-center gap-3 ${result.ok ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                    <span className="text-2xl">{result.ok ? '✅' : '❌'}</span>
                    <div>
                        {result.ok ? 'Верно!' : `Неверно. Правильный тон: ${result.correct}`}
                        <span className="ml-2 text-sm opacity-70">({token})</span>
                    </div>
                </div>
            )}

            <div className="flex justify-end">
                <button onClick={nextRound} className="btn btn-primary">Следующий →</button>
            </div>
        </div>
    )
}

/* ========== CONFUSION TRAINER (enhanced) ========== */

function ConfusionTrainer() {
    const { isPlaying, playPinyin } = useAudio()
    const [groupIdx, setGroupIdx] = useState(0)
    const group = CONFUSABLE_GROUPS[groupIdx]
    const [correctToken, setCorrectToken] = useState(() => randomFrom(group.tokens))
    const [options, setOptions] = useState(() => shuffle(group.tokens))
    const [result, setResult] = useState(null)
    const [score, setScore] = useState({ correct: 0, total: 0 })

    const switchGroup = (idx) => {
        setGroupIdx(idx)
        const g = CONFUSABLE_GROUPS[idx]
        const t = randomFrom(g.tokens)
        setCorrectToken(t)
        setOptions(shuffle(g.tokens))
        setResult(null)
    }

    const nextRound = () => {
        const t = randomFrom(group.tokens)
        setCorrectToken(t)
        setOptions(shuffle(group.tokens))
        setResult(null)
    }

    const chooseOption = async (token) => {
        if (result !== null) return
        const ok = token === correctToken
        setResult({ selected: token, correct: correctToken, ok })
        setScore(s => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }))
        await trackProgress('pinyin', `confusion:${correctToken}`, ok)
    }

    return (
        <div className="card space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-lg font-semibold">🔀 Похожие звуки</h2>
                <span className="text-sm text-dark-muted">
                    Счёт: <span className="text-green-500 font-semibold">{score.correct}</span>/{score.total}
                </span>
            </div>

            <div className="flex flex-wrap gap-2">
                {CONFUSABLE_GROUPS.map((g, i) => (
                    <button
                        key={g.name}
                        onClick={() => switchGroup(i)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${i === groupIdx
                            ? 'bg-primary-600 text-white'
                            : 'bg-dark-bg border border-dark-border text-dark-muted hover:border-primary-500/60'
                            }`}
                    >
                        {g.name}
                    </button>
                ))}
            </div>

            <p className="text-sm text-dark-muted">{group.description}</p>

            <div className="flex items-center gap-3">
                <button onClick={() => playPinyin(correctToken)} className="btn btn-primary">
                    {isPlaying ? '🔊 Играет...' : '▶ Слушать'}
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {options.map((token) => {
                    const isSelected = result?.selected === token
                    const isCorrectToken = result?.correct === token
                    const isWrongChoice = result && isSelected && !result.ok

                    let cls = 'p-3 rounded-xl border-2 text-center transition-all cursor-pointer font-medium '
                    if (result === null) {
                        cls += 'border-dark-border bg-dark-bg hover:border-primary-500/60'
                    } else if (isCorrectToken) {
                        cls += 'border-green-500 bg-green-500/20 text-green-400'
                    } else if (isWrongChoice) {
                        cls += 'border-red-500 bg-red-500/20 text-red-400'
                    } else {
                        cls += 'border-dark-border bg-dark-bg opacity-50'
                    }

                    return (
                        <button key={token} onClick={() => chooseOption(token)} className={cls}>
                            {token}
                        </button>
                    )
                })}
            </div>

            {result && (
                <div className={`rounded-xl p-3 ${result.ok ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                    {result.ok ? '✅ Верно!' : `❌ Неверно. Прозвучало: ${result.correct}`}
                </div>
            )}

            <div className="flex justify-end">
                <button onClick={nextRound} className="btn btn-primary">Следующий →</button>
            </div>
        </div>
    )
}

/* ========== SPEAKING PRACTICE (enhanced) ========== */

function SpeakingPractice() {
    const recognitionRef = useRef(null)
    const { playPinyin } = useAudio()
    const [categoryIdx, setCategoryIdx] = useState(0)
    const category = SPEAKING_CATEGORIES[categoryIdx]
    const [itemIdx, setItemIdx] = useState(0)
    const current = category.items[itemIdx % category.items.length]
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [result, setResult] = useState(null)
    const [stats, setStats] = useState({ correct: 0, total: 0 })

    const SpeechRecognition = typeof window !== 'undefined'
        ? (window.SpeechRecognition || window.webkitSpeechRecognition)
        : null
    const supported = Boolean(SpeechRecognition)

    useEffect(() => () => {
        if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null }
    }, [])

    const nextPhrase = () => {
        setItemIdx(i => (i + 1) % category.items.length)
        setTranscript('')
        setResult(null)
    }

    const startListening = () => {
        if (!SpeechRecognition || isListening) return
        const recognition = new SpeechRecognition()
        recognition.lang = 'zh-CN'
        recognition.interimResults = false
        recognition.maxAlternatives = 1
        recognition.onstart = () => { setIsListening(true); setTranscript(''); setResult(null) }
        recognition.onresult = async (event) => {
            const spoken = event.results?.[0]?.[0]?.transcript ?? ''
            const ok = normalizeSpokenText(spoken).includes(normalizeSpokenText(current.hanzi))
            setTranscript(spoken)
            setResult(ok)
            setStats(s => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }))
            await trackProgress('pinyin', `speaking:${current.hanzi}`, ok)
        }
        recognition.onerror = () => setResult(false)
        recognition.onend = () => { setIsListening(false); recognitionRef.current = null }
        recognitionRef.current = recognition
        recognition.start()
    }

    const stopListening = () => {
        if (recognitionRef.current) recognitionRef.current.stop()
    }

    return (
        <div className="card space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-lg font-semibold">🎙️ Практика говорения</h2>
                <div className="flex items-center gap-3 text-sm">
                    {!supported && <span className="text-xs text-yellow-400">⚠️ Распознавание не поддерживается</span>}
                    <span className="text-dark-muted">
                        Счёт: <span className="text-green-500 font-semibold">{stats.correct}</span>/{stats.total}
                    </span>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {SPEAKING_CATEGORIES.map((c, i) => (
                    <button
                        key={c.name}
                        onClick={() => { setCategoryIdx(i); setItemIdx(0); setTranscript(''); setResult(null) }}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${i === categoryIdx
                            ? 'bg-primary-600 text-white'
                            : 'bg-dark-bg border border-dark-border text-dark-muted hover:border-primary-500/60'
                            }`}
                    >
                        {c.name}
                    </button>
                ))}
            </div>

            <div className="p-5 rounded-xl bg-dark-bg border border-dark-border text-center">
                <div className="text-xs text-dark-muted mb-1">Произнесите:</div>
                <div className="text-3xl font-bold chinese-text mb-1">{current.hanzi}</div>
                <div className="pinyin text-lg">{current.pinyin}</div>
                <div className="text-sm text-dark-muted mt-1">{current.ru}</div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
                <button
                    onClick={isListening ? stopListening : startListening}
                    className={`btn text-lg px-6 py-3 ${isListening ? 'bg-red-600 hover:bg-red-700 text-white' : 'btn-primary'}`}
                    disabled={!supported}
                >
                    {isListening ? '⏹ Остановить' : '🎙 Записать'}
                </button>
                <button onClick={nextPhrase} className="btn btn-secondary px-6 py-3">
                    Следующая →
                </button>
            </div>

            {transcript && (
                <div className="text-center text-sm">
                    Распознано: <span className="font-semibold text-white">{transcript}</span>
                </div>
            )}

            {result !== null && (
                <div className={`rounded-xl p-4 text-center ${result ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                    {result ? '✅ Отлично, фраза распознана!' : '❌ Попробуйте ещё раз — говорите медленнее и чётче.'}
                </div>
            )}
        </div>
    )
}

/* ========== LESSON QUIZ ========== */

function LessonQuiz({ lessonId }) {
    const { playPinyin } = useAudio()
    const quizData = LESSON_QUIZZES[lessonId] || []
    const [current, setCurrent] = useState(0)
    const [selected, setSelected] = useState(null)
    const [score, setScore] = useState(0)
    const [finished, setFinished] = useState(false)

    if (quizData.length === 0) return null

    const q = quizData[current]
    const total = quizData.length
    const passed = finished && score >= Math.ceil(total * 0.8)

    const handleSelect = async (option) => {
        if (selected !== null) return
        setSelected(option)
        const ok = String(option) === String(q.answer)
        if (ok) setScore(s => s + 1)
        await trackProgress('pinyin', `quiz:${lessonId}:${current}`, ok)
    }

    const nextQuestion = () => {
        if (current + 1 >= total) {
            setFinished(true)
        } else {
            setCurrent(c => c + 1)
            setSelected(null)
        }
    }

    const restart = () => {
        setCurrent(0)
        setSelected(null)
        setScore(0)
        setFinished(false)
    }

    if (finished) {
        const pct = Math.round(score / total * 100)
        return (
            <div className="card space-y-4 text-center">
                <h2 className="text-lg font-semibold">📝 Результат проверки</h2>
                <div className={`text-4xl font-bold ${passed ? 'text-green-400' : 'text-red-400'}`}>
                    {score}/{total} ({pct}%)
                </div>
                <div className="text-sm text-dark-muted">
                    {passed
                        ? '🎉 Отлично! Вы прошли проверку. Урок завершён!'
                        : '😅 Для прохождения нужно 80%+. Попробуйте ещё раз!'
                    }
                </div>
                {/* Progress bar */}
                <div className="w-full bg-dark-bg rounded-full h-3 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${passed ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <button onClick={restart} className="btn btn-primary">
                    {passed ? '🔄 Пройти ещё раз' : '🔄 Попробовать снова'}
                </button>
            </div>
        )
    }

    return (
        <div className="card space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">📝 Проверка знаний</h2>
                <span className="text-sm text-dark-muted">{current + 1}/{total}</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-dark-bg rounded-full h-2 overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full transition-all duration-300"
                    style={{ width: `${((current) / total) * 100}%` }} />
            </div>

            <p className="font-medium">{q.prompt}</p>

            {q.audio && (
                <button onClick={() => playPinyin(q.audio)} className="btn btn-primary">
                    ▶ Слушать
                </button>
            )}

            <div className="grid grid-cols-2 gap-3">
                {q.options.map((opt) => {
                    const isSelected = selected === opt
                    const isCorrect = String(opt) === String(q.answer)
                    const isWrong = selected !== null && isSelected && !isCorrect

                    let cls = 'p-3 rounded-xl border-2 text-center cursor-pointer transition-all font-medium '
                    if (selected === null) {
                        cls += 'border-dark-border bg-dark-bg hover:border-primary-500/60'
                    } else if (isCorrect) {
                        cls += 'border-green-500 bg-green-500/20 text-green-400'
                    } else if (isWrong) {
                        cls += 'border-red-500 bg-red-500/20 text-red-400'
                    } else {
                        cls += 'border-dark-border bg-dark-bg opacity-50'
                    }

                    return (
                        <button key={String(opt)} onClick={() => handleSelect(opt)} className={cls}>
                            {q.type === 'tone' && typeof opt === 'number' ? (
                                <div className="flex items-center justify-center gap-2">
                                    <ToneContour tone={opt} size={28} color={isCorrect && selected !== null ? '#22c55e' : '#818cf8'} />
                                    <span>Тон {opt}</span>
                                </div>
                            ) : String(opt)}
                        </button>
                    )
                })}
            </div>

            {selected !== null && (
                <div className="flex justify-end">
                    <button onClick={nextQuestion} className="btn btn-primary">
                        {current + 1 >= total ? 'Завершить' : 'Далее →'}
                    </button>
                </div>
            )}
        </div>
    )
}

/* ========== LESSON DETAIL (enhanced) ========== */

function LessonDetail({ lesson }) {
    const navigate = useNavigate()
    const { playPinyin } = useAudio()
    const { user } = useAuth()
    const [saved, setSaved] = useState(false)

    const completeLesson = async () => {
        await trackProgress('pinyin', `lesson:${lesson.id}`, true)
        setSaved(true)
    }

    const lessonNumber = parseInt(lesson.id.replace('lesson-', ''), 10)

    return (
        <div className="space-y-6">
            <button onClick={() => navigate('/пиньинь')} className="btn btn-ghost">
                ← Назад к урокам
            </button>

            <div className="card bg-gradient-to-r from-primary-600/20 to-primary-800/20 border-primary-500/30">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <div className="text-sm text-primary-400 mb-1">Урок {lessonNumber} из {PINYIN_LESSONS.length}</div>
                        <h1 className="text-2xl font-bold">{lesson.title}</h1>
                        <div className="text-dark-muted">{lesson.subtitle}</div>
                        <p className="mt-3 text-sm text-dark-muted">{lesson.goal}</p>
                    </div>
                    <button onClick={completeLesson} className="btn btn-primary">
                        ✓ Отметить пройденным
                    </button>
                </div>

                {/* Lesson progress indicator */}
                <div className="mt-4 w-full bg-dark-bg rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${(lessonNumber / PINYIN_LESSONS.length) * 100}%` }} />
                </div>

                {saved && <div className="mt-3 text-sm text-green-400">✅ Урок отмечен в прогрессе.</div>}
                {!user && <div className="mt-3 text-sm text-yellow-400">⚠️ Войдите в аккаунт, чтобы сохранять прогресс.</div>}
            </div>

            {/* Theory cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {lesson.items.map((item) => (
                    <div key={item.symbol} className="card hover:border-primary-500/30 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-3xl chinese-text text-primary-500 font-bold">{item.symbol}</div>
                                <div className="text-sm text-dark-muted mt-1">IPA: {item.ipa}</div>
                            </div>
                            <button onClick={() => playPinyin(item.sample)} className="btn btn-secondary">
                                🔊 {item.sample}
                            </button>
                        </div>

                        <p className="mt-3 text-sm">{item.tip}</p>

                        <div className="mt-4 p-3 rounded-lg bg-dark-bg border border-dark-border">
                            <div className="text-xs text-dark-muted">Пример</div>
                            <div className="flex items-center justify-between gap-3 mt-1">
                                <div>
                                    <div className="text-xl chinese-text">{item.example.hanzi}</div>
                                    <div className="pinyin">{item.example.pinyin}</div>
                                    <div className="text-sm text-dark-muted">{item.example.ru}</div>
                                </div>
                                <button onClick={() => playPinyin(item.sample)} className="btn btn-ghost">🔊</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quiz section */}
            <LessonQuiz lessonId={lesson.id} />

            {/* Navigation */}
            <div className="flex justify-between">
                {lessonNumber > 1 && (
                    <Link to={lessonUrl(`lesson-${lessonNumber - 1}`)} className="btn btn-secondary">
                        ← Урок {lessonNumber - 1}
                    </Link>
                )}
                <div className="flex-1" />
                {lessonNumber < PINYIN_LESSONS.length && (
                    <Link to={lessonUrl(`lesson-${lessonNumber + 1}`)} className="btn btn-primary">
                        Урок {lessonNumber + 1} →
                    </Link>
                )}
            </div>
        </div>
    )
}

/* ========== LESSONS TAB ========== */

function LessonsTab() {
    return (
        <div className="space-y-4">
            <div className="card">
                <h2 className="text-lg font-semibold mb-2">📚 Курс произношения</h2>
                <p className="text-sm text-dark-muted mb-4">
                    12 последовательных уроков: от базовых инициалей до связной речи.
                    Каждый урок содержит теорию, аудио-примеры и тест.
                </p>

                {/* Progress bar */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 bg-dark-bg rounded-full h-3 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary-500 to-green-500 rounded-full" style={{ width: '0%' }} />
                    </div>
                    <span className="text-sm text-dark-muted">0/{PINYIN_LESSONS.length}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PINYIN_LESSONS.map((lesson, idx) => {
                    const num = idx + 1
                    const isInitials = num <= 6
                    const isFinals = num >= 7 && num <= 9
                    const isAdvanced = num >= 10
                    const badge = isInitials ? '🔤 Инициали' : isFinals ? '🗣️ Финали' : '⚡ Продвинутые'
                    const badgeColor = isInitials ? 'text-blue-400' : isFinals ? 'text-green-400' : 'text-yellow-400'

                    return (
                        <Link
                            key={lesson.id}
                            to={lessonUrl(lesson.id)}
                            className="p-4 rounded-xl bg-dark-card border border-dark-border hover:border-primary-500/60 hover:shadow-lg hover:shadow-primary-600/10 transition-all group"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold text-lg shrink-0">
                                    {num}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <div className="font-semibold group-hover:text-primary-400 transition-colors">{lesson.title}</div>
                                        <span className={`text-xs ${badgeColor}`}>{badge}</span>
                                    </div>
                                    <div className="text-sm text-primary-400 mt-0.5">{lesson.subtitle}</div>
                                    <div className="text-sm text-dark-muted mt-1 truncate">{lesson.goal}</div>
                                </div>
                                <span className="text-dark-muted group-hover:text-primary-400 transition-colors">→</span>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}

/* ========== TONES TAB ========== */

function TonesTab() {
    return (
        <div className="space-y-6">
            <ToneGuide />
            <TonalPairs />
            <ToneTrainer />
        </div>
    )
}

/* ========== CONFUSION TAB ========== */

function ConfusionTab() {
    return (
        <div className="space-y-6">
            <ConfusionTrainer />
        </div>
    )
}

/* ========== SPEAKING TAB ========== */

function SpeakingTab() {
    return (
        <div className="space-y-6">
            <SpeakingPractice />
        </div>
    )
}

/* ========== TEACHER RECORDER ========== */

function TeacherRecorder() {
    const { playPinyin } = useAudio()
    const [token, setToken] = useState('ma1')
    const [isRecording, setIsRecording] = useState(false)
    const [recordings, setRecordings] = useState([])
    const [uploadStatus, setUploadStatus] = useState(null)
    const [recordedBlob, setRecordedBlob] = useState(null)
    const mediaRecorderRef = useRef(null)
    const chunksRef = useRef([])
    const fileInputRef = useRef(null)

    // Load existing teacher recordings
    useEffect(() => {
        fetchRecordings()
    }, [])

    const fetchRecordings = async () => {
        try {
            const res = await fetch('/api/teacher-audio/list')
            const data = await res.json()
            setRecordings(data.items || [])
        } catch { /* ignore */ }
    }

    // Start recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
            })
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            mediaRecorder.onstop = () => {
                const ext = mediaRecorder.mimeType.includes('webm') ? 'webm' : 'ogg'
                const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
                setRecordedBlob({ blob, ext })
                stream.getTracks().forEach(t => t.stop())
            }

            mediaRecorderRef.current = mediaRecorder
            mediaRecorder.start()
            setIsRecording(true)
            setRecordedBlob(null)
            setUploadStatus(null)
        } catch (err) {
            setUploadStatus({ ok: false, msg: 'Нет доступа к микрофону: ' + err.message })
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }
    }

    const uploadRecordedBlob = async () => {
        if (!recordedBlob) return
        const formData = new FormData()
        formData.append('file', recordedBlob.blob, `${token}.${recordedBlob.ext}`)
        try {
            const res = await fetch(`/api/teacher-audio/upload?token=${encodeURIComponent(token)}`, {
                method: 'POST',
                body: formData,
            })
            const data = await res.json()
            if (res.ok) {
                setUploadStatus({ ok: true, msg: `✅ Загружено: ${data.filename}` })
                setRecordedBlob(null)
                fetchRecordings()
            } else {
                setUploadStatus({ ok: false, msg: data.detail || 'Ошибка загрузки' })
            }
        } catch (err) {
            setUploadStatus({ ok: false, msg: 'Ошибка сети: ' + err.message })
        }
    }

    const uploadFile = async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        try {
            const res = await fetch(`/api/teacher-audio/upload?token=${encodeURIComponent(token)}`, {
                method: 'POST',
                body: formData,
            })
            const data = await res.json()
            if (res.ok) {
                setUploadStatus({ ok: true, msg: `✅ Загружено: ${data.filename}` })
                fetchRecordings()
            } else {
                setUploadStatus({ ok: false, msg: data.detail || 'Ошибка загрузки' })
            }
        } catch (err) {
            setUploadStatus({ ok: false, msg: 'Ошибка сети: ' + err.message })
        }
    }

    const deleteRecording = async (recToken) => {
        try {
            await fetch(`/api/teacher-audio/${encodeURIComponent(recToken)}`, { method: 'DELETE' })
            fetchRecordings()
        } catch { /* ignore */ }
    }

    const playRecorded = () => {
        if (!recordedBlob) return
        const url = URL.createObjectURL(recordedBlob.blob)
        const audio = new Audio(url)
        audio.onended = () => URL.revokeObjectURL(url)
        audio.play()
    }

    return (
        <div className="card space-y-5">
            <h2 className="text-lg font-semibold">🎤 Запись преподавателя</h2>
            <p className="text-sm text-dark-muted">
                Запишите правильное произношение или загрузите файл. Записанное аудио будет использоваться
                <strong className="text-primary-400"> вместо</strong> автоматического при воспроизведении.
            </p>

            {/* Token input */}
            <div className="flex items-center gap-3 flex-wrap">
                <label className="text-sm font-medium">Слог (token):</label>
                <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value.toLowerCase().trim())}
                    placeholder="ma1"
                    className="px-3 py-2 rounded-lg bg-dark-bg border border-dark-border text-white w-32 focus:border-primary-500 outline-none"
                />
                <button onClick={() => playPinyin(token)} className="btn btn-secondary text-sm">
                    ▶ Прослушать текущее
                </button>
            </div>

            {/* Recording controls */}
            <div className="flex flex-wrap gap-2">
                {!isRecording ? (
                    <button onClick={startRecording} className="btn btn-primary px-5">
                        🎙 Начать запись
                    </button>
                ) : (
                    <button onClick={stopRecording} className="btn bg-red-600 hover:bg-red-700 text-white px-5">
                        ⏹ Остановить
                    </button>
                )}

                {isRecording && (
                    <span className="flex items-center gap-2 text-red-400 text-sm animate-pulse">
                        <span className="w-3 h-3 rounded-full bg-red-500" /> Запись...
                    </span>
                )}
            </div>

            {/* Recorded preview */}
            {recordedBlob && (
                <div className="p-3 rounded-xl bg-dark-bg border border-dark-border flex items-center gap-3 flex-wrap">
                    <span className="text-sm">Запись готова ({(recordedBlob.blob.size / 1024).toFixed(1)} КБ)</span>
                    <button onClick={playRecorded} className="btn btn-secondary text-sm">▶ Прослушать</button>
                    <button onClick={uploadRecordedBlob} className="btn btn-primary text-sm">
                        📤 Сохранить как «{token}»
                    </button>
                </div>
            )}

            {/* File upload */}
            <div className="flex items-center gap-3">
                <button onClick={() => fileInputRef.current?.click()} className="btn btn-secondary">
                    📁 Загрузить файл
                </button>
                <span className="text-xs text-dark-muted">MP3, WAV, OGG, WEBM (макс. 10 МБ)</span>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp3,.wav,.ogg,.webm"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
                />
            </div>

            {/* Status */}
            {uploadStatus && (
                <div className={`rounded-xl p-3 text-sm ${uploadStatus.ok ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                    {uploadStatus.msg}
                </div>
            )}

            {/* Existing recordings list */}
            {recordings.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-dark-muted">Загруженные записи ({recordings.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {recordings.map((rec) => (
                            <div key={rec.token} className="flex items-center gap-2 p-2 rounded-lg bg-dark-bg border border-dark-border">
                                <span className="font-mono text-primary-400 text-sm flex-1">{rec.token}</span>
                                <span className="text-xs text-dark-muted">{(rec.size / 1024).toFixed(1)} КБ</span>
                                <button onClick={() => {
                                    const a = new Audio(rec.url)
                                    a.play()
                                }} className="btn btn-ghost text-xs">▶</button>
                                <button onClick={() => deleteRecording(rec.token)} className="btn btn-ghost text-xs text-red-400 hover:text-red-300">✕</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function TeacherTab() {
    return (
        <div className="space-y-6">
            <TeacherRecorder />
        </div>
    )
}

/* ========== MAIN PINYIN PAGE ========== */

export default function Pinyin() {
    const { lessonId } = useParams()
    const normalizedLessonId = useMemo(() => normalizeLessonId(lessonId), [lessonId])
    const selectedLesson = useMemo(
        () => PINYIN_LESSONS.find((lesson) => lesson.id === normalizedLessonId),
        [normalizedLessonId]
    )
    const [activeTab, setActiveTab] = useState('lessons')

    if (lessonId && !selectedLesson) {
        return (
            <div className="card text-center py-10">
                <h1 className="text-2xl font-bold mb-2">Урок не найден</h1>
                <Link to="/пиньинь" className="btn btn-primary">Вернуться к разделу Пиньинь</Link>
            </div>
        )
    }

    if (selectedLesson) {
        return <LessonDetail lesson={selectedLesson} />
    }

    return (
        <div className="space-y-6">
            {/* Hero */}
            <div className="card bg-gradient-to-r from-primary-600/20 to-purple-800/20 border-primary-500/30">
                <div className="flex items-center gap-4">
                    <div className="text-5xl">拼</div>
                    <div>
                        <h1 className="text-3xl font-bold">Лаборатория пиньиня</h1>
                        <p className="text-dark-muted mt-1">
                            Тоны · Инициали · Финали · Похожие звуки · Говорение
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Tab content */}
            {activeTab === 'lessons' && <LessonsTab />}
            {activeTab === 'tones' && <TonesTab />}
            {activeTab === 'confusion' && <ConfusionTab />}
            {activeTab === 'speaking' && <SpeakingTab />}
            {activeTab === 'teacher' && <TeacherTab />}
        </div>
    )
}
