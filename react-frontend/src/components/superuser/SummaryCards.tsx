/**
    1. Import the component and the SummaryStat type:
 *
 *    import SummaryCards, { type SummaryStat } from '../../components/superuser/SummaryCards';
 *
 * 2. Define your stats array:
 *
 *    const stats: SummaryStat[] = [
 *      { title: "Total Users",     count: 120,  icon: <BsPeople size={20} />,      iconColor: "text-blue-600",  bg: "bg-blue-50"  },
 *      { title: "Active Users",    count: 98,   icon: <BsPersonCheck size={20} />, iconColor: "text-green-600", bg: "bg-green-50" },
 *      { title: "Suspended Users", count: 22,   icon: <BsPersonX size={20} />,     iconColor: "text-red-600",   bg: "bg-red-50"   },
 *    ];
 *
 * 3. Render the component:
 *
 *    <SummaryCards stats={stats} />
 *
 *    Or with a custom grid class:
 *
 *    <SummaryCards stats={stats} gridClassName="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl" />
 *
 * ---------------------------------------------------------------------------
 */

import React from 'react';

export interface SummaryStat {
  title: string;
  count: number | string;
  icon: React.ReactNode;
  iconColor: string;
  bg: string;
}

interface SummaryCardsProps {
  stats: SummaryStat[];
  /** Override the default grid layout class. Defaults to a 3-column responsive grid. */
  gridClassName?: string;
}

export default function SummaryCards({ stats, gridClassName }: SummaryCardsProps) {
  const gridClass = gridClassName || 'grid grid-cols-1 md:grid-cols-3 gap-6';

  return (
    <div className={gridClass}>
      {stats.map((stat, i) => (
        <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div className={`p-2 rounded-lg ${stat.bg} ${stat.iconColor}`}>
              {stat.icon}
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">{stat.title}</p>
            <p className="text-2xl font-bold text-slate-900">{stat.count}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
