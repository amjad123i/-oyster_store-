import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";

interface DigitalOrderFormProps {
  productId: Id<"products">;
  onClose: () => void;
}

export function DigitalOrderForm({ productId, onClose }: DigitalOrderFormProps) {
  const product = useQuery(api.products.get, { id: productId });
  const createDigitalOrder = useMutation(api.digitalOrders.create);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!product) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
        <div className="bg-surface rounded-xl p-6 w-full max-w-sm shadow-medium">
          <p>جاري تحميل المنتج...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }
    setIsSubmitting(true);
    try {
      await createDigitalOrder({ 
        productId, 
        customerName: name, 
        customerPhone: phone,
        customerEmail: email,
      });
      toast.success("تم إرسال طلبك بنجاح! سيتم إرسال الكود إلى بريدك الإلكتروني قريباً.");
      onClose();
    } catch (error) {
      toast.error("حدث خطأ أثناء إرسال الطلب.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-xl p-6 w-full max-w-sm shadow-medium">
        <h3 className="text-lg font-bold mb-2 text-text-primary">شراء كود رقمي</h3>
        <p className="text-text-secondary mb-4">منتج: <span className="font-semibold">{product.name}</span></p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="الاسم الكامل"
            required
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-field"
            placeholder="رقم الواتساب"
            required
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="البريد الإلكتروني لاستلام الكود"
            required
          />
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 btn btn-secondary" disabled={isSubmitting}>إلغاء</button>
            <button type="submit" className="flex-1 btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "جاري الإرسال..." : "تأكيد الطلب"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
