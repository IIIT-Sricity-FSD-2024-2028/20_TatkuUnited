export default function Revenue() {
  function handleRevenueSplit({
    platformFeePercent,
    price,
  }: {
    platformFeePercent: number;
    price: number;
  }) {
    const platformShare = Math.round(price * (platformFeePercent / 100));
    const providerShare = price - platformShare;
    return { platformShare, providerShare };
  }

  // Example placeholder for future revenue calculations
  const sample = handleRevenueSplit({ platformFeePercent: 20, price: 50000 });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">Revenue & Earnings</h2>
      <p className="text-sm text-slate-500 mt-1">
        Overview of your completed job settlements and earnings.
      </p>
      <div className="mt-4 text-xs text-slate-400">
        Default platform commission split: {sample.platformShare / 100} /{" "}
        {sample.providerShare / 100}
      </div>{" "}
    </div>
  );
}
