import { Link } from 'react-router-dom'
import { formatPrice } from '../../data/catalogue'

function RecommendationCard({ product }) {
  return (
    <article className="recommendation-card glass-card">
      <Link className="recommendation-image-link" to={`/products/${product.id}`}>
        {product.image_url ? <img src={product.image_url} alt={product.name} /> : <span className="image-placeholder">No image yet</span>}
      </Link>
      <div className="recommendation-card-copy">
        <p className="product-category">{product.category_name || 'Uncategorised'}</p>
        <h3><Link to={`/products/${product.id}`}>{product.name}</Link></h3>
        <strong>{formatPrice(product.price)}</strong>
      </div>
    </article>
  )
}

function RecommendationSection({ title, description, products, loading, error }) {
  return (
    <section className="recommendation-section">
      <div className="recommendation-heading">
        <div>
          <p className="eyebrow">Content-based picks</p>
          <h2 className="section-title">{title}</h2>
        </div>
        {description && <p>{description}</p>}
      </div>
      {loading && <div className="glass-card recommendation-state"><h3>Finding similar pieces...</h3></div>}
      {!loading && error && <div className="form-message error recommendation-state" role="alert">{error}</div>}
      {!loading && !error && !products.length && <div className="glass-card recommendation-state"><h3>No similar pieces yet.</h3><p>More catalogue items will make these recommendations more useful.</p></div>}
      {!loading && !error && products.length > 0 && <div className="recommendation-grid">{products.map((product) => <RecommendationCard key={product.id} product={product} />)}</div>}
    </section>
  )
}

export default RecommendationSection
