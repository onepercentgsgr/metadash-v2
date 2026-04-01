export function MetricCard({ label, value, change, icon, loading = false }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-2">{label}</p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-800 rounded animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-white">{value}</p>
          )}
          {change && (
            <p className={`text-sm mt-2 ${change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
              {change}
            </p>
          )}
        </div>
        {icon && <span className="text-3xl">{icon}</span>}
      </div>
    </div>
  );
}
