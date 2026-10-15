import { useEffect, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './Pages/Common/LandingPage'
import RegisterPage from './Pages/Common/RegisterPage'
import LoginPage from './Pages/Common/LoginPage'
import UserHomePage from './Pages/User/UserHomePage'
import ShopPage from './Pages/User/ShopPage'
import ProductDetailPage from './Pages/User/ProductDetailPage'
import CartPage from './Pages/User/CartPage'
import CheckoutPage from './Pages/User/CheckoutPage'
import OrderConfirmationPage from './Pages/User/OrderConfirmationPage'
import OrderHistoryPage from './Pages/User/OrderHistoryPage'
import AdminCategoriesPage from './Pages/Admin/AdminCategoriesPage'
import AdminProductsPage from './Pages/Admin/AdminProductsPage'
import AdminOrdersPage from './Pages/Admin/AdminOrdersPage'
import AdminDashboardPage from './Pages/Admin/AdminDashboardPage'
import AdminInsightsPage from './Pages/Admin/AdminInsightsPage'
import { fetchProfile } from './api/catalogueApi'
import './App.css'

function ProtectedRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const [state, setState] = useState({ loading: true, user: null, error: '' })

  useEffect(() => {
    fetchProfile()
      .then((user) => setState({ loading: false, user, error: '' }))
      .catch((error) => setState({ loading: false, user: null, error: error.message }))
  }, [])

  if (state.loading) return <div className="page-shell"><main className="content-width admin-access-panel"><p className="eyebrow">Checking access</p><h1>Verifying your <em>studio role.</em></h1></main></div>
  if (state.error) return <div className="page-shell"><main className="content-width admin-access-panel"><p className="eyebrow">Access check failed</p><h1>Admin access could not be <em>verified.</em></h1><p>{state.error}</p><Link className="button-primary" to="/login">Return to login</Link></main></div>
  if (!state.user?.is_admin) return <div className="page-shell"><main className="content-width admin-access-panel"><p className="eyebrow">Admin studio</p><h1>This space is for <em>authorized admins.</em></h1><p>Your account is authenticated, but it has not been granted catalogue admin access.</p><Link className="button-secondary" to="/shop">Return to shop</Link></main></div>
  return children
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
        <Route path="/shop" element={<ProtectedRoute><ShopPage theme={theme} onToggleTheme={toggleTheme} /></ProtectedRoute>} />
        <Route path="/products/:productId" element={<ProtectedRoute><ProductDetailPage theme={theme} onToggleTheme={toggleTheme} /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute><CartPage theme={theme} onToggleTheme={toggleTheme} /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage theme={theme} onToggleTheme={toggleTheme} /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrderHistoryPage theme={theme} onToggleTheme={toggleTheme} /></ProtectedRoute>} />
        <Route path="/orders/:orderId/confirmation" element={<ProtectedRoute><OrderConfirmationPage theme={theme} onToggleTheme={toggleTheme} /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminRoute><AdminDashboardPage theme={theme} onToggleTheme={toggleTheme} /></AdminRoute></ProtectedRoute>} />
        <Route path="/admin/insights" element={<ProtectedRoute><AdminRoute><AdminInsightsPage theme={theme} onToggleTheme={toggleTheme} /></AdminRoute></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute><AdminRoute><AdminCategoriesPage theme={theme} onToggleTheme={toggleTheme} /></AdminRoute></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute><AdminRoute><AdminProductsPage theme={theme} onToggleTheme={toggleTheme} /></AdminRoute></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute><AdminRoute><AdminOrdersPage theme={theme} onToggleTheme={toggleTheme} /></AdminRoute></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
