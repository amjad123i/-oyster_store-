import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SignOutButton } from "../SignOutButton";

interface SettingsProps {
  onAdminClick: () => void;
}

export function Settings({ onAdminClick }: SettingsProps) {
  const user = useQuery(api.auth.loggedInUser);

  return (
    <div className="p-4 space-y-6">
      <div className="bg-surface border border-gray-200 rounded-xl p-4 shadow-subtle">
        <h3 className="font-bold mb-3 text-text-primary">معلومات المستخدم</h3>
        <div className="space-y-2">
          <p><strong className="text-text-secondary">الاسم:</strong> {user?.name}</p>
          <p><strong className="text-text-secondary">البريد:</strong> {user?.email}</p>
        </div>
      </div>

      <button
        onClick={onAdminClick}
        className="w-full btn btn-accent py-3 text-lg"
      >
        لوحة الإدارة
      </button>

      <div className="mt-8 sign-out-container">
        <SignOutButton />
      </div>
    </div>
  );
}
