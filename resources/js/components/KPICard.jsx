export const KPICard = ({ title, value, icon, change }) => (
  <div className="bg-card rounded-lg border p-5 flex items-start gap-4">
    <div className="p-3 rounded-lg bg-primary/10 text-primary">{icon}</div>
    <div className="flex-1">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {change && <p className="text-xs text-green-600 mt-1">{change}</p>}
    </div>
  </div>
);
