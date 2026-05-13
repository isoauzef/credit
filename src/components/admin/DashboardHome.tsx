import { useAdminApi, type DashboardStats } from "../../hooks/useAdmin";
import { Users, CreditCard, DollarSign, Clock } from "lucide-react";

export default function DashboardHome() {
  const { data: stats, loading } = useAdminApi<DashboardStats>("/api/admin/stats");

  const cards = [
    {
      label: "Contact Submissions",
      value: stats?.totalContacts ?? "—",
      icon: Users,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Checkout Submissions",
      value: stats?.totalCheckouts ?? "—",
      icon: CreditCard,
      color: "from-purple-500 to-purple-600",
    },
    {
      label: "Authorized Holds",
      value: stats?.authorized ?? "—",
      icon: Clock,
      color: "from-amber-500 to-amber-600",
    },
    {
      label: "Revenue (captured)",
      value: stats ? `$${(stats.revenue / 100).toLocaleString()}` : "—",
      icon: DollarSign,
      color: "from-emerald-500 to-emerald-600",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Overview of your business metrics.</p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <div
              key={c.label}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5 flex items-start gap-4"
            >
              <div
                className={`rounded-lg bg-gradient-to-br ${c.color} p-2.5 text-white`}
              >
                <c.icon size={20} />
              </div>
              <div>
                <p className="text-sm text-slate-400">{c.label}</p>
                <p className="mt-1 text-2xl font-bold text-white">{c.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
