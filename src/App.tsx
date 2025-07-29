import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "./SignInForm";
import { Toaster, toast } from "sonner";
import { useState } from "react";
import { ProductGrid } from "./components/ProductGrid";
import { ProductDetail } from "./components/ProductDetail";
import { Cart } from "./components/Cart";
import { OrderConfirmation } from "./components/OrderConfirmation";
import { Settings } from "./components/Settings";
import { AdminPanel } from "./components/AdminPanel";
import { Categories } from "./components/Categories";
import { DigitalOrderForm } from "./components/DigitalOrderForm";
import { Id } from "../convex/_generated/dataModel";

type Page = "home" | "cart" | "order-confirmation" | "settings" | "admin" | "categories";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [digitalOrderProductId, setDigitalOrderProductId] = useState<Id<"products"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === "Oyster123") {
      setCurrentPage("admin");
      setShowAdminLogin(false);
      setAdminPassword("");
      toast.success("تم تسجيل الدخول كمدير");
    } else {
      toast.error("كلمة المرور غير صحيحة");
    }
  };

  const handleProductClick = (id: string) => {
    setSelectedProductId(id);
  };

  const handleProductDetailClose = () => {
    setSelectedProductId(null);
  };

  const handleDigitalOrderRequest = (productId: Id<"products">) => {
    setDigitalOrderProductId(productId);
    setSelectedProductId(null); // Close product detail when opening order form
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <Authenticated>
        <Header 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
        <main className="flex-1 pb-24">
          <Content 
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            searchQuery={searchQuery}
            onAdminClick={() => setShowAdminLogin(true)}
            onProductClick={handleProductClick}
          />
        </main>
        {currentPage !== 'admin' && <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} />}
        
        <ProductDetail 
          productId={selectedProductId} 
          onBack={handleProductDetailClose} 
          onDigitalOrder={handleDigitalOrderRequest}
        />

        {digitalOrderProductId && (
          <DigitalOrderForm 
            productId={digitalOrderProductId}
            onClose={() => setDigitalOrderProductId(null)}
          />
        )}
      </Authenticated>
      
      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
          <div className="w-full max-w-md bg-surface p-8 rounded-xl shadow-medium sign-in-container">
            <div className="text-center mb-8">
              <img 
                src="https://e.top4top.io/p_3495lkblh1.png" 
                alt="Oyster Logo" 
                className="w-24 h-24 mx-auto mb-4 rounded-full shadow-lg"
              />
              <h1 className="text-4xl font-bold text-primary mb-2">Oyster</h1>
              <p className="text-text-secondary">أهلاً بك! سجل الدخول للمتابعة</p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
      
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-xl p-6 w-full max-w-sm shadow-medium">
            <h3 className="text-lg font-bold mb-4 text-text-primary">دخول المدير</h3>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="input-field"
                placeholder="أدخل كلمة المرور"
                required
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 btn btn-secondary">إلغاء</button>
                <button type="submit" className="flex-1 btn btn-primary">دخول</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toaster richColors />
    </div>
  );
}

function Header({ searchQuery, setSearchQuery, currentPage, setCurrentPage }: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}) {
  const showSearch = currentPage === 'home';
  const pageTitles: Record<Page | "product", string> = {
    home: "Oyster",
    cart: "السلة",
    categories: "الفئات",
    settings: "الإعدادات",
    admin: "لوحة الإدارة",
    product: "تفاصيل المنتج",
    "order-confirmation": "تأكيد الطلب",
  };

  return (
    <header className="sticky top-0 z-20 bg-surface/80 backdrop-blur-lg border-b border-gray-200/80 p-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 flex-shrink-0">
          <img 
            src="https://e.top4top.io/p_3495lkblh1.png" 
            alt="Oyster Logo" 
            className="w-12 h-12 rounded-lg"
          />
          <h1 className="text-2xl font-bold text-primary">{pageTitles[currentPage]}</h1>
        </div>

        {showSearch && (
          <div className="flex-1 w-full">
            <div className="relative">
              <input
                type="text"
                placeholder="البحث عن المنتجات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {currentPage !== 'home' && (
          <>
            <div className="flex-1"></div> {/* Spacer */}
            <button onClick={() => setCurrentPage('home')} className="btn btn-ghost">
              الرئيسية
            </button>
          </>
        )}
      </div>
    </header>
  );
}

function Content({ 
  currentPage, 
  setCurrentPage,
  searchQuery,
  onAdminClick,
  onProductClick
}: {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  searchQuery: string;
  onAdminClick: () => void;
  onProductClick: (id: string) => void;
}) {
  const handleBack = () => {
    if (currentPage === 'admin') setCurrentPage('settings');
    else if (currentPage === 'categories') setCurrentPage('home');
    else if (currentPage === 'order-confirmation') setCurrentPage('cart');
    else setCurrentPage('home');
  };

  switch (currentPage) {
    case "home":
      return <ProductGrid searchQuery={searchQuery} onProductClick={onProductClick} />;
    case "cart":
      return <Cart onOrderConfirm={() => setCurrentPage("order-confirmation")} />;
    case "order-confirmation":
      return <OrderConfirmation onBack={() => setCurrentPage("cart")} onOrderComplete={() => setCurrentPage("home")} />;
    case "categories":
      return <Categories onProductClick={onProductClick} onBack={handleBack} />;
    case "settings":
      return <Settings onAdminClick={onAdminClick} />;
    case "admin":
      return <AdminPanel onBack={() => setCurrentPage("settings")} />;
    default:
      return null;
  }
}

function BottomNav({ currentPage, setCurrentPage }: {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}) {
  const navItems = [
    { 
      id: "home" as const, 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ), 
      label: "الرئيسية" 
    },
    { 
      id: "categories" as const, 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ), 
      label: "الفئات" 
    },
    { 
      id: "cart" as const, 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ), 
      label: "السلة" 
    },
    { 
      id: "settings" as const, 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ), 
      label: "الإعدادات" 
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-lg border-t border-gray-200/80 z-20">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`flex-1 py-2 flex flex-col items-center justify-center gap-1 transition-colors ${
              currentPage === item.id ? "text-primary" : "text-text-secondary hover:text-primary"
            }`}
          >
            {item.icon}
            <span className="text-xs font-semibold">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
