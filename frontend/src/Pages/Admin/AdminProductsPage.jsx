import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import UserNavbar from '../../Components/User/UserNavbar'
import { createProduct, deleteProduct, fetchCategories, fetchProducts, updateProduct } from '../../api/catalogueApi'
import { formatPrice } from '../../data/catalogue'

const emptyForm = { name: '', description: '', price: '', category: '', stock: '0', is_available: true, image: null }

function AdminProductsPage({ theme, onToggleTheme }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [clearImage, setClearImage] = useState(false)
  const [preview, setPreview] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([fetchProducts(), fetchCategories()])
      .then(([nextProducts, nextCategories]) => {
        if (!active) return
        setProducts(nextProducts)
        setCategories(nextCategories)
        if (nextCategories[0]) setForm((current) => current.category ? current : { ...current, category: String(nextCategories[0].id) })
      })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return products.filter((product) => !query || `${product.name} ${product.description} ${product.category_name || ''}`.toLowerCase().includes(query))
  }, [products, search])

  const resetForm = () => { setForm(emptyForm); setEditingId(null); setClearImage(false); setPreview('') }
  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }))
  const selectImage = (event) => { const file = event.target.files?.[0] || null; setForm((current) => ({ ...current, image: file })); setClearImage(false); setPreview(file ? URL.createObjectURL(file) : '') }

  const submitForm = async (event) => {
    event.preventDefault()
    setSaving(true); setError(''); setNotice('')
    const data = new FormData()
    data.append('name', form.name.trim())
    data.append('description', form.description.trim())
    data.append('price', form.price)
    data.append('category', form.category)
    data.append('stock', form.stock)
    data.append('is_available', String(form.is_available))
    if (form.image) data.append('image', form.image)
    if (editingId && clearImage) data.append('clear_image', 'true')
    try {
      const saved = editingId ? await updateProduct(editingId, data) : await createProduct(data)
      setProducts((current) => editingId ? current.map((product) => product.id === editingId ? saved : product) : [saved, ...current])
      setNotice(editingId ? 'Product updated in the database.' : 'Product created in the database.')
      resetForm()
    } catch (requestError) { setError(requestError.message) } finally { setSaving(false) }
  }

  const editProduct = (product) => { setEditingId(product.id); setForm({ name: product.name, description: product.description, price: product.price, category: String(product.category || ''), stock: String(product.stock), is_available: product.is_available, image: null }); setClearImage(false); setPreview(product.image_url || ''); setNotice(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const removeProduct = async (product) => {
    if (!window.confirm(`Delete “${product.name}”? This removes the database record.`)) return
    setError(''); setNotice('')
    try { await deleteProduct(product.id); setProducts((current) => current.filter((item) => item.id !== product.id)); if (editingId === product.id) resetForm(); setNotice('Product deleted from the database.') } catch (requestError) { setError(requestError.message) }
  }

  return <div className="page-shell user-page"><UserNavbar theme={theme} onToggleTheme={onToggleTheme} cartCount={0} /><main className="content-width admin-page"><div className="admin-heading"><div><p className="eyebrow">Knot & Bloom / admin studio</p><h1>Build the <em>collection.</em></h1><p>Create and maintain real products, stock, prices, categories, and saved media files for customer shopping.</p></div><Link className="button-secondary" to="/admin/categories">Manage categories</Link></div><div className="admin-product-layout"><section className="glass-card product-form-card"><div className="section-kicker"><span>{editingId ? 'Edit product' : 'New product'}</span><span className="status-pill">{products.length} total</span></div><h2>{editingId ? 'Refine a product' : 'Add a product'}</h2><form onSubmit={submitForm} encType="multipart/form-data"><div className="form-field"><label htmlFor="product-name">Name</label><input className="form-control" id="product-name" name="name" value={form.name} onChange={updateField} maxLength={200} required /></div><div className="form-field"><label htmlFor="product-description">Description</label><textarea className="form-control category-description" id="product-description" name="description" value={form.description} onChange={updateField} required /></div><div className="admin-form-grid"><div className="form-field"><label htmlFor="product-price">Price (INR)</label><input className="form-control" id="product-price" name="price" type="number" min="0.01" step="0.01" value={form.price} onChange={updateField} required /></div><div className="form-field"><label htmlFor="product-stock">Stock</label><input className="form-control" id="product-stock" name="stock" type="number" min="0" step="1" value={form.stock} onChange={updateField} required /></div></div><div className="form-field"><label htmlFor="product-category">Category</label><select className="form-control" id="product-category" name="category" value={form.category} onChange={updateField} required><option value="">Select a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div><label className="availability-toggle"><input name="is_available" type="checkbox" checked={form.is_available} onChange={updateField} /> Available to customers</label><div className="form-field image-upload-field"><label htmlFor="product-image">Product image</label><input id="product-image" name="image" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={selectImage} /><small>JPG, PNG, or WEBP · maximum 5 MB</small>{preview && <img className="upload-preview" src={preview} alt="Selected product preview" />}{editingId && form.image === null && form.name && <label className="clear-image-toggle"><input type="checkbox" checked={clearImage} onChange={(event) => setClearImage(event.target.checked)} /> Remove current image</label>}</div><div className="form-actions"><button className="button-primary" type="submit" disabled={saving || !categories.length}>{saving ? 'Saving…' : editingId ? 'Save product' : 'Create product'}</button>{editingId && <button className="button-secondary" type="button" onClick={resetForm}>Cancel</button>}</div></form>{(error || notice) && <p className={error ? 'admin-notice error-text' : 'admin-notice'} role="status">{error || notice}</p>}</section><section className="glass-card product-list-card"><div className="category-list-header"><div><p className="eyebrow">Product library</p><h2>All products</h2></div><label className="admin-search"><span className="sr-only">Search products</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" /></label></div>{!categories.length && !loading && <div className="form-message error">Add a category before creating a product.</div>}<div className="product-admin-list">{loading ? <div className="list-empty">Loading products…</div> : visibleProducts.length ? visibleProducts.map((product) => <article className="product-admin-row" key={product.id}><div className="product-admin-image">{product.image_url ? <img src={product.image_url} alt="" /> : <span className="image-placeholder">No image</span>}</div><div className="product-admin-copy"><h3>{product.name}</h3><p>{product.category_name || 'Uncategorised'} · {formatPrice(product.price)} · {product.stock} in stock</p><span className={product.is_available && product.stock > 0 ? 'availability-pill' : 'availability-pill muted'}>{product.is_available && product.stock > 0 ? 'Available' : 'Unavailable'}</span></div><div className="category-row-actions"><button className="text-button" type="button" onClick={() => editProduct(product)}>Edit</button><button className="text-button danger-text" type="button" onClick={() => removeProduct(product)}>Delete</button></div></article>) : <div className="list-empty">No products found.</div>}</div></section></div></main></div>
}

export default AdminProductsPage
