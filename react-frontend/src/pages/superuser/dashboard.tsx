export default function SuperUser_Dashboard()
{
    const total_gmv = 10000;
    const revenue = [
  { label: "Providers (80%)", amount: "₹8,000", percentage: 78},
  { label: "Managers (15%)", amount: "₹1,500", percentage: 12},
  { label: "Platform / Super User (10%)", amount: "₹500", percentage: 10},
];

    return(
        <div className="max-w-5xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                    Platform Revenue Analysis
                </h1>
                <p className="text-slate-500 text-sm">
                    Comprehensive breakdown of collective revenue distribution.
                </p>
            </div>
            <div className="bg-white rounded-xlshadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800">Collective Revenue Breakdown</h2>
                    <p className="text-slate-500 text-sm">Distribution by role based on settled ledger entries.</p>
                </div>

                <div className="p-6">
                    <div className="inline-block border border-slate-200 rounded-lg p-4 mb-8 min-w-50">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total GMV</p>
                        <p className="text-2xl font-bold text-slate-900">{total_gmv}</p>
                    </div>

                    <div className="flex flex-col gap-6">
                        {revenue.map((item) => (
                            <div className="flex justify-between items-end mb-2 text-sm font-semibold text-slate-700">
                                <span>{item.label}</span>
                                <span>{item.amount}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}