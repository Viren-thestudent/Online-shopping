"""Content-based product recommendations for the live catalogue.

The recommender is intentionally content-based for now. The application has
order-item history, but it does not collect server-side product views or cart
events, so this module does not claim to personalize recommendations from
customer behaviour.
"""

from __future__ import annotations

from dataclasses import dataclass

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .models import Product


MAX_RECOMMENDATIONS = 4


@dataclass
class _FittedModel:
    signature: tuple
    product_ids: tuple[int, ...]
    vectorizer: TfidfVectorizer
    matrix: object


class ContentBasedRecommender:
    """Fit TF-IDF once per catalogue version and rank by cosine similarity."""

    def __init__(self):
        self._model: _FittedModel | None = None

    @staticmethod
    def _product_text(product: Product) -> str:
        """Build a weighted text document from the existing product fields."""

        name = (product.name or "").strip()
        category = (product.category.name if product.category else "").strip()
        description = (product.description or "").strip()

        # Repeating name and category gives those structured fields more
        # influence without inventing a separate feature or hardcoded catalog.
        text = " ".join(
            part
            for part in (name, name, category, category, description)
            if part
        )
        # A valid Product normally has a name. This keeps TF-IDF safe even for
        # legacy rows whose searchable text is empty.
        return text or "product"

    @staticmethod
    def _signature(products: list[Product]) -> tuple:
        """Represent every field that affects text or candidate availability."""

        return tuple(
            (
                product.pk,
                product.name or "",
                product.category_id,
                product.category.name if product.category else "",
                product.description or "",
                bool(product.is_available),
                product.stock,
                product.updated_at.isoformat() if product.updated_at else None,
            )
            for product in products
        )

    def _ensure_fitted(self, products: list[Product]) -> None:
        signature = self._signature(products)
        if self._model and self._model.signature == signature:
            return

        if not products:
            self._model = None
            return

        vectorizer = TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 2),
            token_pattern=r"(?u)\b[\w-]+\b",
        )
        matrix = vectorizer.fit_transform(
            [self._product_text(product) for product in products]
        )
        self._model = _FittedModel(
            signature=signature,
            product_ids=tuple(product.pk for product in products),
            vectorizer=vectorizer,
            matrix=matrix,
        )

    def recommend(self, product_id: int, limit: int = MAX_RECOMMENDATIONS) -> list[Product]:
        """Return available products most similar to ``product_id``.

        The source product may itself be unavailable so a customer can still
        see alternatives. Unavailable or out-of-stock products are never
        returned as recommendations.
        """

        products = list(
            Product.objects.select_related("category").order_by("pk")
        )
        current_index = next(
            (index for index, product in enumerate(products) if product.pk == product_id),
            None,
        )
        if current_index is None:
            raise Product.DoesNotExist

        self._ensure_fitted(products)
        if not self._model or len(products) < 2:
            return []

        try:
            recommendation_limit = max(0, min(int(limit), MAX_RECOMMENDATIONS))
        except (TypeError, ValueError):
            recommendation_limit = MAX_RECOMMENDATIONS
        if recommendation_limit == 0:
            return []

        candidate_indices = [
            index
            for index, product in enumerate(products)
            if index != current_index
            and product.is_available
            and product.stock > 0
        ]
        if not candidate_indices:
            return []

        scores = cosine_similarity(
            self._model.matrix[current_index],
            self._model.matrix[candidate_indices],
        ).ravel()
        ranked = sorted(
            zip(scores, candidate_indices),
            key=lambda item: (-float(item[0]), products[item[1]].pk),
        )
        return [products[index] for _, index in ranked[:recommendation_limit]]


recommender = ContentBasedRecommender()
