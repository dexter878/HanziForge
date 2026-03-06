import axios from 'axios'

const api = axios.create({
    baseURL: '',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// РРЅС‚РµСЂСЃРµРїС‚РѕСЂ РґР»СЏ РѕР±СЂР°Р±РѕС‚РєРё РѕС€РёР±РѕРє
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            window.location.href = '/прогресс'
        }
        return Promise.reject(error)
    }
)

export default api

