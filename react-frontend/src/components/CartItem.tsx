function CartItem({ item, onRemoveItem }: any) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-4 shadow-sm hover:shadow-md transition">

            <div className="flex items-center justify-between gap-6">

                {/* Service Information */}
                <div className="flex items-center gap-4">

                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl">
                        🛠️
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                            {item.serviceName}
                        </h3>

                        <p className="text-sm text-slate-500 mt-1">
                            📍 {item.location}
                        </p>

                        <p className="text-sm text-slate-500 mt-1">
                            🕒 {item.schedule}
                        </p>
                    </div>

                </div>

                {/* Price + Remove */}
                <div className="text-right">

                    <h3 className="text-lg font-bold text-slate-900">
                        ₹{item.price}
                    </h3>

                    <button
                        className="text-sm text-red-500 hover:text-red-700 mt-2 cursor-pointer"
                        onClick={() => onRemoveItem(item.id)}
                    >
                        Remove
                    </button>

                </div>

            </div>

        </div>
    );
}

export default CartItem;