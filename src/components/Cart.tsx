import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { formatCurrency } from "../lib/format";

interface CartProps {
  onOrderConfirm?: () => void;
}

export function Cart({ onOrderConfirm }: CartProps) {
  const cartItems = useQuery(api.cart.list) || [];
  const updateQuantity = useMutation(api.cart.updateQuantity);
  const removeItem = useMutation(api.cart.remove);

  const validCartItems = cartItems.filter((item): item is NonNullable<typeof item> => Boolean(item && item.product));
  
  const total = validCartItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  const hasOutOfStockItems = validCartItems.some(item => item.product?.isOutOfStock);

  const handleQuantityChange = async (itemId: Id<"cartItems">, newQuantity: number) => {
    try {
      await updateQuantity({ itemId, quantity: newQuantity });
    } catch (error: any) {
      toast.error(error.data?.message || "حدث خطأ أثناء تحديث الكمية");
    }
  };

  const handleRemoveItem = async (itemId: Id<"cartItems">) => {
    try {
      await removeItem({ itemId });
      toast.success("تمت إزالة المنتج من السلة");
    } catch (error: any) {
      toast.error("حدث خطأ أثناء إزالة المنتج");
    }
  };

  const handleProceedToCheckout = () => {
    if (hasOutOfStockItems) {
      toast.error("يرجى إزالة المنتجات غير المتوفرة من السلة للمتابعة");
      return;
    }
    if (onOrderConfirm) {
      onOrderConfirm();
    }
  };

  if (validCartItems.length === 0) {
    return (
      <div className="p-4 text-center text-text-secondary h-64 flex flex-col items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p>سلتك فارغة حالياً</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {hasOutOfStockItems && (
        <div className="bg-danger/10 border border-danger/20 rounded-lg p-3 mb-4">
          <p className="text-danger font-semibold text-center">
            ⚠️ بعض المنتجات في سلتك غير متوفرة حالياً
          </p>
        </div>
      )}
      
      <div className="space-y-4 mb-6">
        {validCartItems.map((item) => (
          <div 
            key={item._id} 
            className={`bg-surface border border-gray-200 rounded-xl p-4 shadow-subtle flex gap-4 items-center ${
              item.product?.isOutOfStock ? "opacity-70 bg-danger/5" : ""
            }`}
          >
            <img
              src={item.product?.imageUrl || ''}
              alt={item.product?.name}
              className="w-24 h-24 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-text-primary">{item.product?.name}</h3>
              <p className="text-primary font-bold text-lg my-1">
                {formatCurrency(item.product?.price || 0)}
              </p>
              {item.product?.isOutOfStock ? (
                <p className="text-danger text-sm font-medium">غير متوفر حالياً</p>
              ) : (
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                    className="w-8 h-8 btn btn-secondary rounded-full flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-bold">{item.quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                    className="w-8 h-8 btn btn-secondary rounded-full flex items-center justify-center"
                    disabled={item.quantity >= (item.product?.stockQuantity || 0)}
                  >
                    +
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => handleRemoveItem(item._id)} className="text-gray-400 hover:text-danger">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        ))}
      </div>
      
      <div className="bg-secondary p-4 rounded-xl mb-4 border border-primary/20">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-text-primary">المجموع:</span>
          <span className="text-2xl font-bold text-primary">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
      
      <button
        onClick={handleProceedToCheckout}
        disabled={hasOutOfStockItems}
        className="w-full btn btn-primary py-3 text-lg"
      >
        {hasOutOfStockItems ? "يرجى تعديل السلة" : "إتمام الطلب"}
      </button>
    </div>
  );
}
