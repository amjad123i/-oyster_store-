import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";

const DIGITAL_CODES_CATEGORY_NAME = "اكواد رقمية";

function CategoryItem({ category, onEdit, onDelete }: { category: any, onEdit: (cat: any) => void, onDelete: (id: Id<"categories">) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const children = useQuery(api.categories.listByParent, { parentId: category._id });
  const isProtected = category.name === DIGITAL_CODES_CATEGORY_NAME;

  return (
    <div className="bg-surface border border-gray-200 rounded-lg p-3 pl-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {children && children.length > 0 ? (
            <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:bg-gray-200 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : <div className="w-6"></div>}
          <h3 className="font-semibold">{category.name}</h3>
        </div>
        {!isProtected && (
          <div className="flex gap-2">
            <button onClick={() => onEdit(category)} className="btn btn-secondary btn-sm">تعديل</button>
            <button onClick={() => onDelete(category._id)} className="btn btn-danger btn-sm">حذف</button>
          </div>
        )}
      </div>
      {isExpanded && children && (
        <div className="pt-2 pl-6 space-y-2">
          {children.map(child => (
            <CategoryItem key={child._id} category={child} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}


export function AdminPanelCategories({ onAdd, onEdit, onDelete }: { onAdd: () => void, onEdit: (cat: any) => void, onDelete: (id: Id<"categories">) => void }) {
  const rootCategories = useQuery(api.categories.listByParent, { parentId: null });
  const seedDigitalCodeCategory = useMutation(api.categories.seedDigitalCodeCategory);

  if (rootCategories === undefined) {
    return <div>جاري تحميل الفئات...</div>;
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={onAdd} className="btn btn-primary">
          إضافة فئة جديدة
        </button>
        <button 
          onClick={async () => {
            try {
              await seedDigitalCodeCategory();
              toast.success("تمت إضافة فئة 'اكواد رقمية'");
            } catch (error: any) {
              toast.error(error.data?.message || "خطأ في إضافة الفئة");
            }
          }} 
          className="btn btn-secondary"
        >
          إضافة فئة "اكواد رقمية"
        </button>
      </div>
      <div className="space-y-3">
        {rootCategories.map((category) => (
          <CategoryItem key={category._id} category={category} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
