import { usePaginatedQuery, useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { formatCurrency } from "../lib/format";
import { AdminPanelCategories } from "./AdminPanelCategories";

interface AdminPanelProps {
  onBack: () => void;
}

type AdminTab = "products" | "orders" | "digitalOrders" | "categories" | "stock";
const ITEMS_PER_PAGE = 10;

export function AdminPanel({ onBack }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("products");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: 0,
    stockQuantity: 0,
    categoryId: "",
    image: null as File | null,
  });
  const [categoryForm, setCategoryForm] = useState({ name: "", parentId: "" });

  const { results: products, status: productsStatus, loadMore: loadMoreProducts } = usePaginatedQuery(api.products.list, {}, { initialNumItems: ITEMS_PER_PAGE });
  const allCategories = useQuery(api.categories.list) || []; // Still needed for product form dropdown
  const { results: orders, status: ordersStatus, loadMore: loadMoreOrders } = usePaginatedQuery(api.orders.listAllOrders, {}, { initialNumItems: ITEMS_PER_PAGE });
  const { results: digitalOrders, status: digitalOrdersStatus, loadMore: loadMoreDigitalOrders } = usePaginatedQuery(api.digitalOrders.list, {}, { initialNumItems: ITEMS_PER_PAGE });
  
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const updateStock = useMutation(api.products.updateStock);
  const deleteProduct = useMutation(api.products.remove);
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const deleteCategory = useMutation(api.categories.remove);
  const generateUploadUrl = useMutation(api.products.generateUploadUrl);
  const updateOrderStatus = useMutation(api.orders.updateStatus);
  const updateDigitalOrderStatus = useMutation(api.digitalOrders.updateStatus);

  if (
    productsStatus === "LoadingFirstPage" ||
    ordersStatus === "LoadingFirstPage" ||
    digitalOrdersStatus === "LoadingFirstPage"
  ) {
    return <div className="p-4 text-center">جاري تحميل بيانات الإدارة...</div>;
  }
  
  const resetProductForm = () => {
    setProductForm({ name: "", description: "", price: 0, stockQuantity: 0, categoryId: "", image: null });
    setEditingProduct(null);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.description || productForm.price <= 0 || !productForm.categoryId || productForm.stockQuantity < 0) {
      toast.error("يرجى ملء جميع الحقول المطلوبة بشكل صحيح.");
      return;
    }

    try {
      let imageId: Id<"_storage"> | undefined = editingProduct?.imageId;
      
      if (productForm.image) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": productForm.image.type },
          body: productForm.image,
        });
        const { storageId } = await result.json();
        imageId = storageId;
      }

      const productData = {
        name: productForm.name,
        description: productForm.description,
        price: productForm.price,
        stockQuantity: productForm.stockQuantity,
        categoryId: productForm.categoryId as Id<"categories">,
        imageId,
      };

      if (editingProduct) {
        await updateProduct({ id: editingProduct._id, ...productData });
        toast.success("تم تحديث المنتج بنجاح");
      } else {
        await createProduct(productData);
        toast.success("تم إضافة المنتج بنجاح");
      }
      setShowAddProduct(false);
      resetProductForm();
    } catch (error) {
      toast.error("حدث خطأ أثناء حفظ المنتج");
    }
  };

  const handleStockUpdate = async (productId: Id<"products">, newStock: number) => {
    try {
      await updateStock({ id: productId, stockQuantity: newStock });
      toast.success("تم تحديث المخزون");
    } catch (error) {
      toast.error("خطأ في تحديث المخزون");
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name) {
      toast.error("يرجى إدخال اسم الفئة");
      return;
    }
    try {
      const categoryData = {
        name: categoryForm.name,
        parentId: categoryForm.parentId ? (categoryForm.parentId as Id<"categories">) : undefined,
      };

      if (editingCategory) {
        await updateCategory({ id: editingCategory._id, ...categoryData });
        toast.success("تم تحديث الفئة بنجاح");
      } else {
        await createCategory(categoryData);
        toast.success("تم إضافة الفئة بنجاح");
      }
      setShowAddCategory(false);
      setEditingCategory(null);
      setCategoryForm({ name: "", parentId: "" });
    } catch (error: any) {
      toast.error(error.data?.message || "حدث خطأ أثناء حفظ الفئة");
    }
  };

  const handleDeleteProduct = async (productId: Id<"products">) => {
    if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      try {
        await deleteProduct({ id: productId });
        toast.success("تم حذف المنتج بنجاح");
      } catch (error) {
        toast.error("حدث خطأ أثناء حذف المنتج");
      }
    }
  };

  const handleDeleteCategory = async (categoryId: Id<"categories">) => {
    if (confirm("هل أنت متأكد؟ سيتم حذف الفئة ونقل أي فئات فرعية إلى المستوى الأعلى.")) {
      try {
        await deleteCategory({ id: categoryId });
        toast.success("تم حذف الفئة بنجاح");
      } catch (error: any) {
        toast.error(error.data?.message || "حدث خطأ أثناء حذف الفئة");
      }
    }
  };

  const handleOrderStatusUpdate = async (orderId: Id<"orders">, status: "approved" | "rejected") => {
    try {
      await updateOrderStatus({ orderId, status });
      toast.success(`تم ${status === "approved" ? "قبول" : "رفض"} الطلب`);
    } catch (error) {
      toast.error("حدث خطأ أثناء تحديث حالة الطلب");
    }
  };

  const handleDigitalOrderStatusUpdate = async (orderId: Id<"digitalOrders">, status: "completed") => {
    try {
      await updateDigitalOrderStatus({ orderId, status });
      toast.success(`تم تحديث الطلب الرقمي`);
    } catch (error) {
      toast.error("حدث خطأ أثناء تحديث حالة الطلب");
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "products": return <ProductsTabContent />;
      case "stock": return <StockTabContent />;
      case "categories": return <CategoriesTabContent />;
      case "orders": return <OrdersTabContent />;
      case "digitalOrders": return <DigitalOrdersTabContent />;
      default: return null;
    }
  };

  const ProductsTabContent = () => (
    <div>
      <button onClick={() => setShowAddProduct(true)} className="btn btn-primary mb-4">
        إضافة منتج جديد
      </button>
      <div className="space-y-4">
        {products.map((product) => (
          <div key={product._id} className="bg-surface border border-gray-200 rounded-lg p-4 shadow-subtle">
            <div className="flex gap-4">
              <img src={product.imageUrl || ''} alt={product.name} className="w-16 h-16 object-cover rounded-md" />
              <div className="flex-1">
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-text-secondary text-sm">{product.categoryName ?? "غير مصنف"}</p>
                <p className="text-primary font-bold">{formatCurrency(product.price)}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => { setEditingProduct(product); setProductForm({ name: product.name, description: product.description, price: product.price, stockQuantity: product.stockQuantity || 0, categoryId: product.categoryId || "", image: null }); setShowAddProduct(true); }} className="btn btn-secondary text-sm">تعديل</button>
                <button onClick={() => handleDeleteProduct(product._id)} className="btn btn-danger text-sm">حذف</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {productsStatus === "CanLoadMore" && (
        <button onClick={() => loadMoreProducts(ITEMS_PER_PAGE)} className="btn btn-secondary mt-4 w-full">تحميل المزيد</button>
      )}
    </div>
  );

  const StockTabContent = () => (
    <div>
      <h3 className="text-lg font-bold text-text-primary mb-4">إدارة المخزون</h3>
      <div className="space-y-2">
        {products.filter(p => p.categoryName !== "اكواد رقمية").map((product) => (
          <div key={product._id} className="bg-surface border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-4">
              <div className="flex-1"><h4 className="font-semibold">{product.name}</h4></div>
              <div className="flex items-center gap-2">
                <span className="font-bold w-8 text-center">{product.stockQuantity || 0}</span>
                <button onClick={() => handleStockUpdate(product._id, (product.stockQuantity || 0) + 1)} className="btn btn-secondary w-8 h-8 flex items-center justify-center">+</button>
                <button onClick={() => handleStockUpdate(product._id, Math.max(0, (product.stockQuantity || 0) - 1))} className="btn btn-secondary w-8 h-8 flex items-center justify-center">-</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {productsStatus === "CanLoadMore" && (
        <button onClick={() => loadMoreProducts(ITEMS_PER_PAGE)} className="btn btn-secondary mt-4 w-full">تحميل المزيد</button>
      )}
    </div>
  );

  const CategoriesTabContent = () => (
    <AdminPanelCategories 
      onAdd={() => { setEditingCategory(null); setCategoryForm({ name: "", parentId: "" }); setShowAddCategory(true); }}
      onEdit={(cat) => { setEditingCategory(cat); setCategoryForm({ name: cat.name, parentId: cat.parentId || "" }); setShowAddCategory(true); }}
      onDelete={handleDeleteCategory}
    />
  );

  const OrdersTabContent = () => (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order._id} className="bg-surface border border-gray-200 rounded-lg p-4 shadow-subtle">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{order.customerName}</h3>
              <p className="text-sm text-text-secondary">{order.userName} | {order.customerPhone} | {order.customerAddress}</p>
              <p className="text-sm text-text-secondary">({order.shippingLocation === 'baghdad' ? 'بغداد' : 'محافظات'})</p>
            </div>
            <div className="text-right flex-shrink-0 pl-4">
              <p className="text-xs text-text-secondary">المجموع: {formatCurrency(order.subtotal)}</p>
              <p className="text-xs text-text-secondary">التوصيل: {formatCurrency(order.shippingFee)}</p>
              <p className="font-bold text-primary text-lg mt-1">{formatCurrency(order.totalAmount)}</p>
              <span className={`px-2 py-1 rounded text-sm font-semibold mt-1 inline-block ${
                order.status === 'pending' ? 'bg-secondary text-text-primary' :
                order.status === 'approved' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
              }`}>
                {order.status === 'pending' ? 'قيد المراجعة' : order.status === 'approved' ? 'مقبول' : 'مرفوض'}
              </span>
            </div>
          </div>
          <div className="border-t my-2"></div>
          <div className="space-y-2 mb-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <img src={item.imageUrl || ''} alt={item.productName} className="w-10 h-10 object-cover rounded" />
                <p className="text-sm">{item.productName} (×{item.quantity})</p>
              </div>
            ))}
          </div>
          {order.status === "pending" && (
            <div className="flex gap-2">
              <button onClick={() => handleOrderStatusUpdate(order._id, "approved")} className="flex-1 btn btn-primary">قبول</button>
              <button onClick={() => handleOrderStatusUpdate(order._id, "rejected")} className="flex-1 btn btn-danger">رفض</button>
            </div>
          )}
        </div>
      ))}
      {ordersStatus === "CanLoadMore" && (
        <button onClick={() => loadMoreOrders(ITEMS_PER_PAGE)} className="btn btn-secondary mt-4 w-full">تحميل المزيد</button>
      )}
    </div>
  );

  const DigitalOrdersTabContent = () => (
    <div className="space-y-4">
      {digitalOrders.map((order) => (
        <div key={order._id} className="bg-surface border border-gray-200 rounded-lg p-4 shadow-subtle">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{order.customerName}</h3>
              <p className="text-sm text-text-secondary">{order.customerPhone}</p>
              <p className="text-sm text-text-secondary">{order.customerEmail}</p>
            </div>
            <div className="text-right flex-shrink-0 pl-4">
              <p className="font-bold text-primary">{order.productName}</p>
              <span className={`px-2 py-1 rounded text-sm font-semibold mt-1 inline-block ${
                order.status === 'pending' ? 'bg-secondary text-text-primary' : 'bg-success/20 text-success'
              }`}>
                {order.status === 'pending' ? 'قيد المراجعة' : 'مكتمل'}
              </span>
            </div>
          </div>
          {order.status === "pending" && (
            <div className="flex gap-2 mt-2 border-t pt-2">
              <button onClick={() => handleDigitalOrderStatusUpdate(order._id, "completed")} className="flex-1 btn btn-primary">
                إكمال الطلب
              </button>
            </div>
          )}
        </div>
      ))}
      {digitalOrdersStatus === "CanLoadMore" && (
        <button onClick={() => loadMoreDigitalOrders(ITEMS_PER_PAGE)} className="btn btn-secondary mt-4 w-full">تحميل المزيد</button>
      )}
    </div>
  );

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-text-primary">لوحة الإدارة</h2>
        <button onClick={onBack} className="btn btn-ghost">← العودة</button>
      </div>

      <div className="flex mb-6 border-b border-gray-200 overflow-x-auto">
        {(["products", "stock", "categories", "orders", "digitalOrders"] as AdminTab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 font-semibold whitespace-nowrap ${activeTab === tab ? "text-primary border-b-2 border-primary" : "text-text-secondary"}`}>
            { {products: `المنتجات`, stock: `المخزون`, categories: `الفئات`, orders: `الطلبات`, digitalOrders: `الطلبات الرقمية`}[tab] }
          </button>
        ))}
      </div>

      {renderTabContent()}

      {showAddProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editingProduct ? "تعديل المنتج" : "إضافة منتج"}</h3>
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <input type="text" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="اسم المنتج" className="input-field" required />
              <textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} placeholder="الوصف" className="input-field h-20" required />
              <input type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} placeholder="السعر" className="input-field" required />
              <input type="number" value={productForm.stockQuantity} onChange={(e) => setProductForm({ ...productForm, stockQuantity: Number(e.target.value) })} placeholder="كمية المخزون" className="input-field" required />
              <select value={productForm.categoryId} onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })} className="input-field" required>
                <option value="">اختر الفئة</option>
                {allCategories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <input type="file" accept="image/*" onChange={(e) => setProductForm({ ...productForm, image: e.target.files?.[0] || null })} className="input-field" />
              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowAddProduct(false); resetProductForm(); }} className="flex-1 btn btn-secondary">إلغاء</button>
                <button type="submit" className="flex-1 btn btn-primary">{editingProduct ? "تحديث" : "إضافة"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">{editingCategory ? "تعديل الفئة" : "إضافة فئة"}</h3>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <input type="text" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="اسم الفئة" className="input-field" required />
              <select value={categoryForm.parentId} onChange={(e) => setCategoryForm({ ...categoryForm, parentId: e.target.value })} className="input-field">
                <option value="">فئة رئيسية (لا يوجد أب)</option>
                {allCategories.filter(c => c._id !== editingCategory?._id).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowAddCategory(false); setEditingCategory(null); setCategoryForm({ name: "", parentId: "" }); }} className="flex-1 btn btn-secondary">إلغاء</button>
                <button type="submit" className="flex-1 btn btn-primary">{editingCategory ? "تحديث" : "إضافة"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
