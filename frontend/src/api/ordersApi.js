import { apiRequest } from './catalogueApi'

export const createOrder = (data) => apiRequest('/orders/', {
  method: 'POST',
  body: JSON.stringify(data),
})

export const fetchMyOrders = () => apiRequest('/orders/')
export const fetchOrder = (id) => apiRequest(`/orders/${id}`)
export const fetchAdminDashboard = () => apiRequest('/orders/admin/dashboard')
export const fetchAdminInsights = () => apiRequest('/orders/admin/insights')
export const fetchAdminOrders = () => apiRequest('/orders/admin')
export const updateOrderStatus = (id, status) => apiRequest(`/orders/admin/${id}`, {
  method: 'PATCH',
  body: JSON.stringify({ status }),
})
export const submitPaymentReference = (id, utr) => apiRequest(`/orders/${id}/payment`, {
  method: 'POST',
  body: JSON.stringify({ utr }),
})
export const updateOrderPayment = (id, payment_status) => apiRequest(`/orders/admin/${id}/payment`, {
  method: 'PATCH',
  body: JSON.stringify({ payment_status }),
})
