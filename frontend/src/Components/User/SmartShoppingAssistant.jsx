import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../../data/catalogue'

const quickSuggestions = ['Under ₹500', 'Gift ideas', 'Phone covers', 'Keychains']

const categoryRules = [
  {
    terms: ['phone', 'cover', 'case'],
    matches: (text) => /phone|cover|case/.test(text),
  },
  {
    terms: ['flower', 'floral', 'rose', 'tulip'],
    matches: (text) => /flower|floral|rose|tulip/.test(text),
  },
  {
    terms: ['keychain', 'key chain', 'charm'],
    matches: (text) => /keychain|key chain|charm/.test(text),
  },
  {
    terms: ['gift', 'gifts', 'present', 'accessory', 'accessories'],
    matches: (text) => /gift|present|accessor/.test(text),
  },
]

const getBudget = (query) => {
  const match = query.match(/(?:under|below|less than|up to|upto|within)\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)/i)
  if (!match) return null
  return {
    amount: Number(match[1].replace(/,/g, '')),
    inclusive: /up to|upto|within/i.test(match[0]),
  }
}

const productText = (product) => `${product.name} ${product.description} ${product.category_name || ''}`.toLowerCase()

function answerQuestion(query, products, loading, error) {
  if (loading) {
    return { text: 'The live catalogue is still loading. Please try again in a moment.', recommendations: [] }
  }
  if (error) {
    return { text: 'I could not reach the live catalogue right now. Please use the shop controls or try again shortly.', recommendations: [] }
  }
  if (!products.length) {
    return { text: 'There are no catalogue products available to recommend right now.', recommendations: [] }
  }

  const budget = getBudget(query)
  const categoryRule = categoryRules.find((rule) => rule.terms.some((term) => query.includes(term)))
  const matches = products
    .filter((product) => {
      const text = productText(product)
      const price = Number(product.price)
      const withinBudget = budget === null || (budget.inclusive ? price <= budget.amount : price < budget.amount)
      const matchesCategory = !categoryRule || categoryRule.matches(text)
      return withinBudget && matchesCategory
    })
    .sort((first, second) => {
      const firstAvailable = first.is_available && Number(first.stock) > 0
      const secondAvailable = second.is_available && Number(second.stock) > 0
      if (firstAvailable !== secondAvailable) return Number(secondAvailable) - Number(firstAvailable)
      return Number(first.price) - Number(second.price)
    })
    .slice(0, 4)

  if (!matches.length) {
    return {
      text: budget
        ? `I could not find a current match ${budget.inclusive ? 'at or below' : 'under'} ${formatPrice(budget.amount)}. Try a higher budget or another category.`
        : 'I could not find a current catalogue match. Try “under ₹500”, “gift ideas”, “phone covers”, or “keychains”.',
      recommendations: [],
    }
  }

  const budgetText = budget ? ` ${budget.inclusive ? 'at or below' : 'under'} ${formatPrice(budget.amount)}` : ''
  const categoryText = categoryRule ? ` for ${categoryRule.terms[0]}` : ''
  return {
    text: `I found ${matches.length} live catalogue ${matches.length === 1 ? 'piece' : 'pieces'}${categoryText}${budgetText}.`,
    recommendations: matches,
  }
}

function RecommendationCard({ product }) {
  const available = product.is_available && Number(product.stock) > 0

  return (
    <Link className="assistant-product-card" to={`/products/${product.id}`}>
      <div className="assistant-product-image">
        {product.image_url ? <img src={product.image_url} alt={product.name} /> : <span className="image-placeholder">No image</span>}
      </div>
      <div className="assistant-product-copy">
        <strong>{product.name}</strong>
        <span>{formatPrice(product.price)}</span>
        <small className={available ? '' : 'unavailable'}>{available ? `${product.stock} available` : 'Currently unavailable'}</small>
        <em>View piece →</em>
      </div>
    </Link>
  )
}

function SmartShoppingAssistant({ products, loading, error }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi! I can help you browse the live crochet catalogue. Try a budget, category, or gift request.',
      recommendations: [],
    },
  ])

  const ask = (query) => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) return

    const answer = answerQuestion(trimmedQuery.toLowerCase(), products, loading, error)
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-user`, role: 'user', text: trimmedQuery, recommendations: [] },
      { id: `${Date.now()}-assistant`, role: 'assistant', ...answer },
    ])
    setInput('')
  }

  const submit = (event) => {
    event.preventDefault()
    ask(input)
  }

  return (
    <section className="smart-assistant glass-card" aria-labelledby="assistant-title">
      <div className="smart-assistant-heading">
        <div>
          <p className="eyebrow">Free catalogue helper</p>
          <h2 id="assistant-title">Find your next <em>favourite.</em></h2>
          <p>Simple live-catalogue suggestions using your budget and preferences. No external AI service.</p>
        </div>
        <span className="assistant-status">Live catalogue</span>
      </div>
      <div className="assistant-conversation" aria-live="polite">
        {messages.map((message) => (
          <div className={`assistant-message ${message.role}`} key={message.id}>
            <p>{message.text}</p>
            {message.recommendations.length > 0 && <div className="assistant-recommendations">{message.recommendations.map((product) => <RecommendationCard key={product.id} product={product} />)}</div>}
          </div>
        ))}
      </div>
      <div className="assistant-suggestions" aria-label="Shopping assistant suggestions">
        {quickSuggestions.map((suggestion) => <button className="assistant-chip" type="button" key={suggestion} onClick={() => ask(suggestion)}>{suggestion}</button>)}
      </div>
      <form className="assistant-form" onSubmit={submit}>
        <label className="sr-only" htmlFor="shopping-assistant-input">Ask the shopping assistant</label>
        <input id="shopping-assistant-input" type="text" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Try “under ₹500” or “gift ideas”" />
        <button className="button-primary" type="submit" disabled={!input.trim()}>Ask</button>
      </form>
    </section>
  )
}

export default SmartShoppingAssistant
