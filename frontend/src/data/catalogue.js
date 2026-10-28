const STORAGE_KEYS = { cart: 'loopluxe.cart' }

export const PRODUCT_CATEGORIES = [
  'Cover',
  'Flower',
  'Bags',
  'Collection',
  'Keychain',
  'Toy Section',
  'Headband',
  'Diwali',
  'Christmas',
]

const readJson = (key, fallback) => {
  try {
    const value = window.localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export const getCart = () => {
  const cart = readJson(STORAGE_KEYS.cart, {})
  return cart && typeof cart === 'object' ? cart : {}
}

export const saveCart = (cart) => {
  window.localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart))
  window.dispatchEvent(new CustomEvent('loopluxe:cart-updated'))
}

export const cartItemCount = (cart) => Object.values(cart).reduce((total, quantity) => total + quantity, 0)

export const formatPrice = (price) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(price)
