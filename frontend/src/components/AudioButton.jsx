import { useCallback, useRef, useState } from 'react'

const TONE_MAP = {
    a: ['a', 'ā', 'á', 'ǎ', 'à'],
    e: ['e', 'ē', 'é', 'ě', 'è'],
    i: ['i', 'ī', 'í', 'ǐ', 'ì'],
    o: ['o', 'ō', 'ó', 'ǒ', 'ò'],
    u: ['u', 'ū', 'ú', 'ǔ', 'ù'],
    ü: ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ'],
}

function scoreVoice(voice) {
    const lang = String(voice?.lang || '').toLowerCase()
    const name = String(voice?.name || '').toLowerCase()
    let score = 0

    if (lang.startsWith('zh-cn') || lang.includes('cmn-cn')) score += 100
    if (lang.startsWith('cmn')) score += 90
    if (lang.startsWith('zh')) score += 40

    if (name.includes('xiaoxiao') || name.includes('yunxi') || name.includes('xiaoyi') || name.includes('mandarin') || name.includes('putonghua')) {
        score += 35
    }

    if (name.includes('neural')) {
        score += 10
    }

    if (lang.includes('zh-hk') || lang.includes('yue') || name.includes('canton')) {
        score -= 120
    }

    if (lang.includes('zh-tw') || name.includes('taiwan')) {
        score -= 30
    }

    return score
}

function pickMandarinVoice(synth) {
    const voices = synth?.getVoices?.() || []
    if (voices.length === 0) return null

    return voices
        .map((voice) => ({ voice, score: scoreVoice(voice) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)[0]?.voice ?? null
}

function speakMandarin({ text, rate = 0.8, pitch = 1, onEnd, onError }) {
    if (!('speechSynthesis' in window) || !text) {
        onError?.()
        return false
    }

    const synth = window.speechSynthesis
    synth.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = rate
    utterance.pitch = pitch

    const preferredVoice = pickMandarinVoice(synth)
    if (preferredVoice) {
        utterance.voice = preferredVoice
    }

    utterance.onend = onEnd
    utterance.onerror = onError
    synth.speak(utterance)
    return true
}

function normalizePinyinBase(base) {
    return base.toLowerCase().replace(/u:/g, 'ü').replace(/v/g, 'ü')
}

function applyToneToSyllable(syllable) {
    const match = syllable.match(/^([a-zü:]+)([1-5])$/i)
    if (!match) {
        return normalizePinyinBase(syllable)
    }

    const base = normalizePinyinBase(match[1])
    const tone = Number(match[2])

    if (tone === 5) {
        return base
    }

    let targetIndex = -1

    if (base.includes('a')) {
        targetIndex = base.indexOf('a')
    } else if (base.includes('e')) {
        targetIndex = base.indexOf('e')
    } else if (base.includes('ou')) {
        targetIndex = base.indexOf('o')
    } else {
        for (let i = base.length - 1; i >= 0; i -= 1) {
            if ('iuüoae'.includes(base[i])) {
                targetIndex = i
                break
            }
        }
    }

    if (targetIndex < 0) {
        return base
    }

    const vowel = base[targetIndex]
    const markList = TONE_MAP[vowel]
    if (!markList) {
        return base
    }

    return `${base.slice(0, targetIndex)}${markList[tone]}${base.slice(targetIndex + 1)}`
}

function numberedPinyinToMarked(pinyin) {
    if (!pinyin) {
        return ''
    }

    return pinyin
        .trim()
        .split(/\s+/)
        .map((part) => applyToneToSyllable(part))
        .join(' ')
}

function resolveSpeechText(text, pinyin) {
    if (pinyin) {
        return numberedPinyinToMarked(pinyin)
    }
    return text || ''
}

/**
 * Audio playback button.
 * Uses local MP3 first, then falls back to Web Speech API.
 */
export default function AudioButton({
    text,
    pinyin,
    audioSrc,
    size = 'md',
    className = '',
}) {
    const [isPlaying, setIsPlaying] = useState(false)
    const audioRef = useRef(null)

    const sizeClasses = {
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10',
        lg: 'w-12 h-12 text-lg',
    }

    const playWebSpeech = useCallback(() => {
        const speechText = resolveSpeechText(text, pinyin)
        if (!speechText || !('speechSynthesis' in window)) {
            setIsPlaying(false)
            if (!('speechSynthesis' in window)) {
                console.warn('Web Speech API is not available in this browser')
            }
            return
        }

        const started = speakMandarin({
            text: speechText,
            rate: 0.8,
            pitch: 1,
            onEnd: () => setIsPlaying(false),
            onError: () => setIsPlaying(false),
        })
        if (!started) {
            setIsPlaying(false)
        }
    }, [pinyin, text])

    const playAudio = useCallback(async () => {
        if (isPlaying) return
        setIsPlaying(true)

        try {
            if (audioSrc) {
                const audio = new Audio(audioSrc)
                audioRef.current = audio

                audio.onended = () => setIsPlaying(false)
                audio.onerror = () => {
                    console.warn('MP3 not found, using Web Speech API fallback')
                    playWebSpeech()
                }

                await audio.play()
                return
            }

            playWebSpeech()
        } catch (error) {
            console.error('Audio playback error:', error)
            playWebSpeech()
        }
    }, [audioSrc, isPlaying, playWebSpeech])

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
        }
        window.speechSynthesis?.cancel()
        setIsPlaying(false)
    }

    return (
        <button
            onClick={isPlaying ? stopAudio : playAudio}
            className={`audio-btn ${sizeClasses[size]} ${isPlaying ? 'playing' : ''} ${className}`}
            title={isPlaying ? 'Остановить' : 'Произнести'}
            aria-label={isPlaying ? 'Остановить аудио' : 'Воспроизвести аудио'}
        >
            {isPlaying ? (
                <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
            ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.999 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM10 8l6 4-6 4V8z" />
                </svg>
            )}
        </button>
    )
}

export function useAudio() {
    const [isPlaying, setIsPlaying] = useState(false)

    const playPinyin = useCallback(async (pinyinWithTone) => {
        if (!pinyinWithTone) return

        setIsPlaying(true)
        // Priority chain: teacher audio → generated audio → Web Speech API
        const teacherSrc = `/static/audio/teacher/${pinyinWithTone}.mp3`
        const generatedSrc = `/static/audio/pinyin/${pinyinWithTone}.mp3`

        const tryGenerated = () => {
            const audio2 = new Audio(generatedSrc)
            audio2.onended = () => setIsPlaying(false)
            audio2.onerror = () => {
                const started = speakMandarin({
                    text: numberedPinyinToMarked(pinyinWithTone),
                    rate: 0.8,
                    onEnd: () => setIsPlaying(false),
                    onError: () => setIsPlaying(false),
                })
                if (!started) setIsPlaying(false)
            }
            audio2.play().catch(() => setIsPlaying(false))
        }

        try {
            const audio = new Audio(teacherSrc)
            audio.onended = () => setIsPlaying(false)
            audio.onerror = () => tryGenerated()
            await audio.play()
        } catch {
            tryGenerated()
        }
    }, [])

    const playChinese = useCallback((chineseText) => {
        if (!chineseText) return

        setIsPlaying(true)

        const started = speakMandarin({
            text: chineseText,
            rate: 0.8,
            onEnd: () => setIsPlaying(false),
            onError: () => setIsPlaying(false),
        })
        if (!started) {
            setIsPlaying(false)
        }
    }, [])

    const stop = useCallback(() => {
        window.speechSynthesis?.cancel()
        setIsPlaying(false)
    }, [])

    return { isPlaying, playPinyin, playChinese, stop }
}
