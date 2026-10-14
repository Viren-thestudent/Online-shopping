export const STORAGE_KEYS = {
  categories: 'loopluxe.categories',
  cart: 'loopluxe.cart',
}

export const DEFAULT_CATEGORIES = [
  { id: 'category-keychains', name: 'Keychains', description: 'Tiny keepsakes for keys, bags, and gifting.' },
  { id: 'category-amigurumi', name: 'Amigurumi', description: 'Small, characterful crochet companions.' },
  { id: 'category-gifts', name: 'Gifts', description: 'Handmade pieces chosen for thoughtful moments.' },
]

export const PRODUCTS = [
  {
    id: 'crochet-bike-keychain',
    name: 'Crochet Bike Keychain',
    categoryId: 'category-keychains',
    price: 499,
    description: 'A tiny blue crochet bike with cheerful flower details, made to brighten your keys or a favourite tote.',
    image: '/assets/crochet-bike-keychain.jpeg',
    badge: 'Handmade favourite',
  },
  {
    id: 'blue-bike-collectible',
    name: 'Blue Bike Collectible',
    categoryId: 'category-amigurumi',
    price: 899,
    description: 'A detailed, lightweight crochet collectible inspired by the reference studio piece and finished with soft yarn texture.',
    image: '/assets/crochet-bike-collage.jpeg',
    badge: 'Small batch',
  },
  {
    id: 'miniature-bike-charm',
    name: 'Miniature Bike Charm',
    categoryId: 'category-gifts',
    price: 649,
    description: 'A playful miniature charm that makes an easy present for makers, cyclists, and anyone who loves tiny details.',
    image: '/assets/crochet-bike-keychain.jpeg',
    badge: 'Gift-ready',
  },
  {
    id: 'collectible-gift-set',
    name: 'Collectible Gift Set',
    categoryId: 'category-gifts',
    price: 1299,
    description: 'A considered pair of crochet keepsakes packaged for a warm, handmade gifting moment.',
    image: '/assets/crochet-bike-collage.jpeg',
    badge: 'Curated set',
  },
]

const readJson = (key, fallback) => {
  try {
    const value = window.localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export const getCategories = () => {
  const categories = readJson(STORAGE_KEYS.categories, null)
  if (Array.isArray(categories)) return categories
  window.localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(DEFAULT_CATEGORIES))
  return DEFAULT_CATEGORIES
}

export const saveCategories = (categories) => {
  window.localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories))
  window.dispatchEvent(new CustomEvent('loopluxe:categories-updated'))
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

export const categoryName = (categories, categoryId) => categories.find((category) => category.id === categoryId)?.name || 'Uncategorised'
