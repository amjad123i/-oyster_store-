import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { formatCurrency } from "../lib/format";

interface OrderConfirmationProps {
  onBack: () => void;
  onOrderComplete: () => void;
}

export function OrderConfirmation({ onBack, onOrderComplete }: OrderConfirmationProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [shippingLocation, setShippingLocation] = useState<"baghdad" | "provinces">("baghdad");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createOrder = useMutation(api.orders.create);
  const cartItems = useQuery(api.cart.list) || [];
  const validCartItems = cartItems.filter((item): item is NonNullable<typeof item> => Boolean(item && item.product));
  
  const subtotal = validCartItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  const shippingFee = shippingLocation === "baghdad" ? 5000 : 10000;
  const total = subtotal + shippingFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerAddress) {
      toast.error("يرجى ملء جميع الحقول المطلوبة.");
      return;
    }
    setIsSubmitting(true);
    try {
      await createOrder({
        customerName,
        customerPhone,
        customerAddress,
        notes,
        shippingLocation,
      });
      toast.success("تم إرسال طلبك بنجاح!");
      onOrderComplete();
    } catch (error: any) {
      toast.error(error.data?.message || "حدث خطأ أثناء إرسال الطلب.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">تأكيد الطلب</h2>
      
      <div className="bg-surface p-4 rounded-xl mb-4 border">
        <h3 className="font-bold mb-2">ملخص الطلب</h3>
        {validCartItems.map(item => (
          <div key={item._id} className="flex justify-between text-sm mb-1">
            <span>{item.product.name} (×{item.quantity})</span>
            <span>{formatCurrency(item.product.price * item.quantity)}</span>
          </div>
        ))}
        <div className="border-t my-2"></div>
        <div className="flex justify-between text-sm mb-1">
          <span>المجموع الفرعي</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>رسوم التوصيل</span>
          <span>{formatCurrency(shippingFee)}</span>
        </div>
        <div className="border-t my-2"></div>
        <div className="flex justify-between font-bold text-lg">
          <span>المجموع الكلي</span>
          <span className="text-primary">{formatCurrency(total)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h3 className="font-bold mb-2 text-text-primary">معلومات التوصيل</h3>
          <div className="space-y-4">
            <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="الاسم الكامل" className="input-field" required />
            <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="رقم الهاتف" className="input-field" required />
            <textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="العنوان الكامل (المحافظة - المدينة - أقرب نقطة دالة)" className="input-field h-24" required />
          </div>
        </div>

        <div>
          <h3 className="font-bold mb-2 text-text-primary">منطقة التوصيل</h3>
          <div className="grid grid-cols-2 gap-2">
            <label className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${shippingLocation === 'baghdad' ? 'border-primary bg-primary/10' : 'border-gray-200'}`}>
              <input type="radio" name="shipping" value="baghdad" checked={shippingLocation === 'baghdad'} onChange={() => setShippingLocation('baghdad')} className="form-radio accent-primary" />
              <span className="font-semibold">بغداد (5,000 د.ع)</span>
            </label>
            <label className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${shippingLocation === 'provinces' ? 'border-primary bg-primary/10' : 'border-gray-200'}`}>
              <input type="radio" name="shipping" value="provinces" checked={shippingLocation === 'provinces'} onChange={() => setShippingLocation('provinces')} className="form-radio accent-primary" />
              <span className="font-semibold">محافظات (10,000 د.ع)</span>
            </label>
          </div>
        </div>

        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات إضافية (اختياري)" className="input-field h-20" />
        
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onBack} className="flex-1 btn btn-secondary" disabled={isSubmitting}>رجوع</button>
          <button type="submit" className="flex-1 btn btn-primary" disabled={isSubmitting || validCartItems.length === 0}>
            {isSubmitting ? "جاري الإرسال..." : "تأكيد الطلب"}
          </button>
        </div>
      </form>
    </div>
  );
}
