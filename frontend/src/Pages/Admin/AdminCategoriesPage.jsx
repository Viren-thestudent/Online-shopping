import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import UserNavbar from '../../Components/User/UserNavbar'
import { createCategory, deleteCategory, fetchCategories, updateCategory } from '../../api/catalogueApi'

const emptyForm = { name: '', description: '' }

function AdminCategoriesPage({ theme, onToggleTheme }) {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadCategories = () => fetchCategories().then(setCategories).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false))
  useEffect(() => { loadCategories() }, [])

  const visibleCategories = useMemo(() => {
    const query = search.trim().toLowerCase()
    return categories.filter((category) => !query || `${category.name} ${category.description}`.toLowerCase().includes(query))
  }, [categories, search])

  const resetForm = () => { setForm(emptyForm); setEditingId(null) }
  const submitForm = async (event) => {
    event.preventDefault()
    setSaving(true); setError(''); setNotice('')
    try {
      const saved = editingId ? await updateCategory(editingId, form) : await createCategory(form)
      setCategories((current) => editingId ? current.map((category) => category.id === editingId ? saved : category) : [...current, saved])
      setNotice(editingId ? 'Category updated in the database.' : 'Category created in the database.')
      resetForm()
    } catch (requestError) { setError(requestError.message) } finally { setSaving(false) }
  }
  const editCategory = (category) => { setEditingId(category.id); setForm({ name: category.name, description: category.description || '' }); setNotice(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const removeCategory = async (category) => {
    if (!window.confirm(`Delete “${category.name}”? Products will remain and become uncategorised.`)) return
    setError(''); setNotice('')
    try { await deleteCategory(category.id); setCategories((current) => current.filter((item) => item.id !== category.id)); if (editingId === category.id) resetForm(); setNotice('Category deleted from the database.') } catch (requestError) { setError(requestError.message) }
  }

  return <div className="page-shell user-page"><UserNavbar theme={theme} onToggleTheme={onToggleTheme} cartCount={0} /><main className="content-width admin-page"><div className="admin-heading"><div><p className="eyebrow">Knot & Bloom / admin studio</p><h1>Shape the <em>catalogue.</em></h1><p>Manage database-backed categories used by customer shopping and product forms.</p></div><Link className="button-secondary" to="/admin/products">Manage products</Link></div><div className="admin-layout"><section className="glass-card category-form-card"><div className="section-kicker"><span>{editingId ? 'Edit category' : 'New category'}</span><span className="status-pill">{categories.length} total</span></div><h2>{editingId ? 'Refine a category' : 'Add a category'}</h2><form onSubmit={submitForm}><div className="form-field"><label htmlFor="category-name">Name</label><input className="form-control" id="category-name" name="name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Home décor" maxLength={100} required /></div><div className="form-field"><label htmlFor="category-description">Description</label><textarea className="form-control category-description" id="category-description" name="description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="A short line for shoppers" maxLength={500} /></div><div className="form-actions"><button className="button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add category'}</button>{editingId && <button className="button-secondary" type="button" onClick={resetForm}>Cancel</button>}</div></form>{(error || notice) && <p className={error ? 'admin-notice error-text' : 'admin-notice'} role="status">{error || notice}</p>}</section><section className="glass-card category-list-card"><div className="category-list-header"><div><p className="eyebrow">Category library</p><h2>All categories</h2></div><label className="admin-search"><span className="sr-only">Search categories</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories" /></label></div><div className="category-list">{loading ? <div className="list-empty">Loading categories…</div> : visibleCategories.length ? visibleCategories.map((category) => <article className="category-row" key={category.id}><div><h3>{category.name}</h3><p>{category.description || 'No description yet.'}</p></div><div className="category-row-actions"><button className="text-button" type="button" onClick={() => editCategory(category)}>Edit</button><button className="text-button danger-text" type="button" onClick={() => removeCategory(category)}>Delete</button></div></article>) : <div className="list-empty">No categories match “{search}”.</div>}</div></section></div></main></div>
}

export default AdminCategoriesPage
