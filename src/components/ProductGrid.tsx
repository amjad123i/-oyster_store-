import { usePaginatedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatCurrency } from "../lib/format";

interface ProductGridProps {
  searchQuery: string;
  onProductClick: (id: string) => void;
}

const ITEMS_PER_PAGE = 10;

export function ProductGrid({ searchQuery, onProductClick }: ProductGridProps) {
  const { 
    results: products, 
    status, 
    loadMore 
  } = usePaginatedQuery(
    api.products.list, 
    { search: searchQuery }, 
    { initialNumItems: ITEMS_PER_PAGE }
  );

  if (status === "LoadingFirstPage") {
    return (
      <div className="p-4 text-center text-text-secondary h-64 flex items-center justify-center">
        <p>جاري تحميل المنتجات...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-4 text-center text-text-secondary h-64 flex items-center justify-center">
        <p>{searchQuery ? "لا توجد منتجات مطابقة للبحث" : "لا توجد منتجات متاحة حالياً"}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <div
            key={product._id}
            onClick={() => onProductClick(product._id)}
            className={`bg-surface rounded-xl shadow-subtle cursor-pointer hover:shadow-medium transition-all duration-300 overflow-hidden group ${
              product.isOutOfStock ? "opacity-60" : ""
            }`}
          >
            {product.imageUrl && (
              <div className="relative aspect-square">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {product.isOutOfStock && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold text-sm bg-danger px-2 py-1 rounded">نفد المخزون</span>
                  </div>
                )}
              </div>
            )}
            <div className="p-3">
              <h3 className="font-semibold text-sm text-text-primary mb-1 line-clamp-2 h-10">{product.name}</h3>
              <div className="flex items-baseline justify-between">
                <p className="text-primary font-bold text-lg">
                  {formatCurrency(product.price)}
                </p>
                {!product.isOutOfStock && (
                  <div className="text-xs text-text-secondary">
                    <span>متوفر: {product.stockQuantity || 0}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {status === "CanLoadMore" && (
        <div className="mt-8 text-center">
          <button onClick={() => loadMore(ITEMS_PER_PAGE)} className="btn btn-secondary">
            تحميل المزيد
          </button>
        </div>
      )}
    </div>
  );
}
