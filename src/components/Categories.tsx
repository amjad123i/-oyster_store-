import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { formatCurrency } from "../lib/format";

interface CategoriesProps {
  onProductClick: (id: string) => void;
  onBack: () => void;
}

type ProductWithUrl = Doc<"products"> & { imageUrl: string | null, isOutOfStock: boolean };
const ITEMS_PER_PAGE = 10;

export function Categories({ onProductClick }: CategoriesProps) {
  const [currentCategoryId, setCurrentCategoryId] = useState<Id<"categories"> | null>(null);

  const children = useQuery(api.categories.listByParent, { parentId: currentCategoryId });
  const currentCategory = useQuery(api.categories.get, currentCategoryId ? { id: currentCategoryId } : "skip");

  const {
    results: categoryProducts,
    status: productsStatus,
    loadMore,
  } = usePaginatedQuery(
    api.categories.getProductsByCategory,
    currentCategoryId ? { categoryId: currentCategoryId } : "skip",
    { initialNumItems: ITEMS_PER_PAGE }
  );

  const hasSubcategories = children && children.length > 0;
  const hasProducts = categoryProducts && categoryProducts.length > 0;

  const renderContent = () => {
    if (children === undefined) {
      return (
        <div className="text-center text-text-secondary py-8">
          جاري التحميل...
        </div>
      );
    }

    if (hasSubcategories) {
      return (
        <div className="space-y-3">
          {children.map((category) => (
            <button
              key={category._id}
              onClick={() => setCurrentCategoryId(category._id)}
              className="w-full bg-surface border border-gray-200 rounded-xl p-4 text-right hover:shadow-md hover:border-primary transition-all shadow-subtle"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="font-bold text-lg text-text-primary">{category.name}</h3>
                </div>
                <span className="text-primary font-bold text-2xl">›</span>
              </div>
            </button>
          ))}
        </div>
      );
    }

    if (productsStatus === "LoadingFirstPage" && currentCategoryId) {
        return (
            <div className="text-center text-text-secondary py-8">
                جاري تحميل المنتجات...
            </div>
        )
    }

    if (hasProducts) {
      return (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categoryProducts.map((product: ProductWithUrl) => (
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
                  <p className="text-primary font-bold text-lg">
                    {formatCurrency(product.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {productsStatus === "CanLoadMore" && (
            <button onClick={() => loadMore(ITEMS_PER_PAGE)} className="w-full btn btn-secondary mt-4">تحميل المزيد</button>
          )}
        </div>
      );
    }
    
    if (!hasSubcategories && productsStatus !== "LoadingFirstPage") {
      return (
        <div className="text-center text-text-secondary py-8">
          {currentCategoryId ? "لا توجد منتجات أو فئات فرعية هنا." : "لا توجد فئات متاحة حالياً."}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-text-primary">
          {currentCategory?.name || "كل الفئات"}
        </h2>
        {currentCategoryId && (
          <button 
            onClick={() => setCurrentCategoryId(currentCategory?.parentId || null)}
            className="btn btn-ghost"
          >
            ← رجوع
          </button>
        )}
      </div>
      
      {renderContent()}
    </div>
  );
}
