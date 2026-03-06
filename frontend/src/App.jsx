import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useParams } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Dictionary from './pages/Dictionary'
import Writing from './pages/Writing'
import Exercises from './pages/Exercises'
import Videos from './pages/Videos'
import HSKTests from './pages/HSKTests'
import Flashcards from './pages/Flashcards'
import Phrasebook from './pages/Phrasebook'
import OCR from './pages/OCR'
import Progress from './pages/Progress'
import Pinyin from './pages/Pinyin'

function NotFound() {
    return (
        <div className="card text-center py-12">
            <h1 className="text-2xl font-bold mb-2">Страница не найдена</h1>
            <p className="text-dark-muted mb-6">Проверьте адрес или вернитесь на главную.</p>
            <Link to="/" className="btn btn-primary">
                На главную
            </Link>
        </div>
    )
}

function RedirectPinyinLesson() {
    const { lessonId } = useParams()
    return <Navigate to={`/пиньинь/${lessonId}`} replace />
}

function App() {
    const [isOnline, setIsOnline] = useState(navigator.onLine)

    useEffect(() => {
        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    return (
        <Layout isOnline={isOnline}>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/словарь" element={<Dictionary />} />
                <Route path="/словарь/:char" element={<Dictionary />} />
                <Route path="/письмо" element={<Writing />} />
                <Route path="/письмо/:char" element={<Writing />} />
                <Route path="/изучение" element={<Exercises />} />
                <Route path="/видео" element={<Videos />} />
                <Route path="/тесты" element={<HSKTests />} />
                <Route path="/флешкарты" element={<Flashcards />} />
                <Route path="/разговорник" element={<Phrasebook />} />
                <Route path="/ocr" element={<OCR />} />
                <Route path="/пиньинь" element={<Pinyin />} />
                <Route path="/пиньинь/:lessonId" element={<Pinyin />} />
                <Route path="/прогресс" element={<Progress />} />

                <Route path="/dictionary" element={<Navigate to="/словарь" replace />} />
                <Route path="/writing" element={<Navigate to="/письмо" replace />} />
                <Route path="/exercises" element={<Navigate to="/изучение" replace />} />
                <Route path="/videos" element={<Navigate to="/видео" replace />} />
                <Route path="/tests" element={<Navigate to="/тесты" replace />} />
                <Route path="/flashcards" element={<Navigate to="/флешкарты" replace />} />
                <Route path="/phrasebook" element={<Navigate to="/разговорник" replace />} />
                <Route path="/progress" element={<Navigate to="/прогресс" replace />} />
                <Route path="/pinyin" element={<Navigate to="/пиньинь" replace />} />
                <Route path="/pinyin/:lessonId" element={<RedirectPinyinLesson />} />

                <Route path="*" element={<NotFound />} />
            </Routes>
        </Layout>
    )
}

export default App
