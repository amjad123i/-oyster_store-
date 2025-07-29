import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { formatCurrency } from "../lib/format";

const DIGITAL_CODES_CATEGORY_NAME = "اكواد رقمية";

interface ProductDetailProps {
  productId: string | null;
  onBack: () => void;
  onDigitalOrder: (productId: Id<"products">) => void;
}

export function ProductDetail({ productId, onBack, onDigitalOrder }: ProductDetailProps) {
  const product = useQuery(api.products.get, productId ? { id: productId as Id<"products"> } : "skip");
  const addToCart = useMutation(api.cart.add);

  if (!productId) return null;

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addToCart({ productId: product._id });
      toast.success(`${product.name} تمت إضافته إلى السلة`);
      onBack(); // Close detail view after adding to cart
    } catch (error: any) {
      toast.error(error.data?.message || "حدث خطأ ما");
    }
  };

  const isDigital = product?.categoryName === DIGITAL_CODES_CATEGORY_NAME;

  return (
    <div className={`fixed inset-0 bg-background z-30 transition-transform duration-300 ${productId ? 'translate-x-0' : 'translate-x-full'}`} dir="rtl">
      <div className="absolute top-0 left-0 right-0 p-4 bg-surface/80 backdrop-blur-lg z-10">
        <button onClick={onBack} className="btn btn-ghost">← رجوع</button>
      </div>
      
      <div className="h-full overflow-y-auto pb-24 pt-20">
        {product ? (
          <div>
            <img src={product.imageUrl || ''} alt={product.name} className="w-full h-64 object-cover" />
            <div className="p-4 space-y-4">
              <h2 className="text-2xl font-bold text-text-primary">{product.name}</h2>
              <p className="text-2xl font-bold text-primary">{formatCurrency(product.price)}</p>
              <p className="text-text-secondary whitespace-pre-wrap">{product.description}</p>
              
              {product.isOutOfStock && !isDigital && (
                  <p className="text-danger font-bold text-lg">نفد المخزون</p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 text-center">جاري تحميل المنتج...</div>
        )}
      </div>

      {product && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface border-t z-10">
          {isDigital ? (
            <button onClick={() => onDigitalOrder(product._id)} className="w-full btn btn-accent py-3 text-lg">
              شراء الكود الآن
            </button>
          ) : (
            <button onClick={handleAddToCart} disabled={product.isOutOfStock} className="w-full btn btn-primary py-3 text-lg">
              {product.isOutOfStock ? "نفد المخزون" : "إضافة إلى السلة"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
