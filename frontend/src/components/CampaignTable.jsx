import { useState } from 'react';

export function CampaignTable({ campaigns, onToggle, loading = false }) {
  const [expandedId, setExpandedId] = useState(null);

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-400">No campaigns found</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Campaign</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Spend</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Purchases</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">CPA</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">ROAS</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {campaigns.map((campaign) => (
              <tr
                key={campaign.id}
                className="hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() => setExpandedId(expandedId === campaign.id ? null : campaign.id)}
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-white">{campaign.name}</div>
                  <div className="text-xs text-gray-500">{campaign.id}</div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      campaign.status === 'ACTIVE'
                        ? 'bg-green-900 text-green-300'
                        : 'bg-red-900 text-red-300'
                    }`}
                  >
                    {campaign.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-white">${(campaign.spend || 0).toFixed(2)}</td>
                <td className="px-6 py-4 text-white">{campaign.purchases || 0}</td>
                <td className="px-6 py-4 text-white">${(campaign.cpa || 0).toFixed(2)}</td>
                <td className="px-6 py-4 text-white">{(campaign.roas || 0).toFixed(2)}x</td>
                <td className="px-6 py-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggle(campaign.id, campaign.status === 'ACTIVE' ? 'pause' : 'enable');
                    }}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      campaign.status === 'ACTIVE'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {campaign.status === 'ACTIVE' ? 'Pause' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
