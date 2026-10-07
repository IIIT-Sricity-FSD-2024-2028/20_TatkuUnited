function CartSummary({ subtotal, gst, total }: any) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm sticky top-6">

            <h2 className="text-xl font-semibold text-slate-900 mb-6">
                Order Summary
            </h2>

            <div className="flex justify-between text-sm text-slate-600 mb-4">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
            </div>

            <div className="flex justify-between text-sm text-slate-600 mb-5">
                <span>GST (18%)</span>
                <span>₹{gst}</span>
            </div>

            <hr className="border-slate-200 mb-5" />

            <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-semibold text-slate-900">
                    Total
                </span>

                <span className="text-xl font-bold text-blue-600">
                    ₹{total}
                </span>
            </div>

            <button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg cursor-pointer transition"
            >
                Confirm & Pay
            </button>

        </div>
    );
}

export default CartSummary;