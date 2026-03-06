import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(localStorage.getItem('token'))
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`
            fetchUser()
        } else {
            setLoading(false)
        }
    }, [token])

    const fetchUser = async () => {
        try {
            const response = await api.get('/api/auth/me')
            setUser(response.data)
        } catch (error) {
            console.error('Ошибка авторизации:', error)
            logout()
        } finally {
            setLoading(false)
        }
    }

    const login = async (username, password) => {
        const response = await api.post('/api/auth/login', { username, password })
        const { access_token, username: name } = response.data
        localStorage.setItem('token', access_token)
        setToken(access_token)
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
        setUser({ username: name })
        return response.data
    }

    const register = async (username, password) => {
        const response = await api.post('/api/auth/register', { username, password })
        const { access_token, username: name } = response.data
        localStorage.setItem('token', access_token)
        setToken(access_token)
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
        setUser({ username: name })
        return response.data
    }

    const logout = () => {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
        delete api.defaults.headers.common['Authorization']
    }

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}
