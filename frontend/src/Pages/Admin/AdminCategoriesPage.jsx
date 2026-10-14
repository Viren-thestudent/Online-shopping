import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import UserNavbar from '../../Components/User/UserNavbar'
import { getCategories, saveCategories } from '../../data/catalogue'

const emptyForm = { name: '', description: '' }

function AdminCategoriesPage({ theme, onToggleTheme }) {
  const [categories, setCategories] = useState(() => getCategories())
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState('')

  const visibleCategories = useMemo(() => {
    const query = search.trim().toLowerCase()
    return categories.filter((category) => !query || `${category.name} ${category.description}`.toLowerCase().includes(query))
  }, [categories, search])

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const submitForm = (event) => {
    event.preventDefault()
    const name = form.name.trim()
    const description = form.description.trim()
    if (!name) return
    const duplicate = categories.some((category) => category.name.toLowerCase() === name.toLowerCase() && category.id !== editingId)
    if (duplicate) {
      setNotice('A category with that name already exists.')
      return
    }
    const nextCategories = editingId
      ? categories.map((category) => category.id === editingId ? { ...category, name, description } : category)
      : [...categories, { id: `category-${Date.now()}`, name, description }]
    setCategories(nextCategories)
    saveCategories(nextCategories)
    setNotice(editingId ? 'Category updated and shared with the shop.' : 'Category added and shared with the shop.')
    resetForm()
  }

  const editCategory = (category) => {
    setEditingId(category.id)
    setForm({ name: category.name, description: category.description })
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteCategory = (category) => {
    if (!window.confirm(`Delete “${category.name}”? Products in this category will remain visible as uncategorised.`)) return
    const nextCategories = categories.filter((item) => item.id !== category.id)
    setCategories(nextCategories)
    saveCategories(nextCategories)
    if (editingId === category.id) resetForm()
    setNotice('Category deleted and the shop filters were updated.')
  }

  return (
    <div className="page-shell user-page">
      <UserNavbar theme={theme} onToggleTheme={onToggleTheme} cartCount={0} />
      <main className="content-width admin-page">
        <div className="admin-heading"><div><p className="eyebrow">LoopLuxe / admin studio</p><h1>Shape the <em>catalogue.</em></h1><p>Manage the categories used by the customer shop. Changes are saved to localStorage and appear in the shop immediately.</p></div><Link className="button-secondary" to="/shop">View customer shop</Link></div>
        <div className="admin-layout">
          <section className="glass-card category-form-card"><div className="section-kicker"><span>{editingId ? 'Edit category' : 'New category'}</span><span className="status-pill">{categories.length} total</span></div><h2>{editingId ? 'Refine a category' : 'Add a category'}</h2><form onSubmit={submitForm}><div className="form-field"><label htmlFor="category-name">Name</label><input className="form-control" id="category-name" name="name" value={form.name} onChange={updateField} placeholder="e.g. Home décor" maxLength={60} /></div><div className="form-field"><label htmlFor="category-description">Description</label><textarea className="form-control category-description" id="category-description" name="description" value={form.description} onChange={updateField} placeholder="A short line for shoppers" maxLength={160} /></div><div className="form-actions"><button className="button-primary" type="submit">{editingId ? 'Save changes' : 'Add category'}</button>{editingId && <button className="button-secondary" type="button" onClick={resetForm}>Cancel</button>}</div></form>{notice && <p className="admin-notice" role="status">{notice}</p>}</section>
          <section className="glass-card category-list-card"><div className="category-list-header"><div><p className="eyebrow">Category library</p><h2>All categories</h2></div><label className="admin-search"><span className="sr-only">Search categories</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories" /></label></div><div className="category-list">{visibleCategories.length ? visibleCategories.map((category) => <article className="category-row" key={category.id}><div><h3>{category.name}</h3><p>{category.description || 'No description yet.'}</p></div><div className="category-row-actions"><button className="text-button" type="button" onClick={() => editCategory(category)}>Edit</button><button className="text-button danger-text" type="button" onClick={() => deleteCategory(category)}>Delete</button></div></article>) : <div className="list-empty">No categories match “{search}”.</div>}</div></section>
        </div>
      </main>
    </div>
  )
}

export default AdminCategoriesPage
