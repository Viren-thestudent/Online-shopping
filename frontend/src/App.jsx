import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './Pages/Common/LandingPage'
import RegisterPage from './Pages/Common/RegisterPage'
import LoginPage from './Pages/Common/LoginPage'
import UserHomePage from './Pages/User/UserHomePage'
import './App.css'

function ProtectedRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" replace />
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((current) => (current === 'light' ? 'dark' : 'light'))

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/register" element={<RegisterPage theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/login" element={<LoginPage theme={theme} onToggleTheme={toggleTheme} />} />
        <Route
          path="/user-home"
          element={
            <ProtectedRoute>
              <UserHomePage theme={theme} onToggleTheme={toggleTheme} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
