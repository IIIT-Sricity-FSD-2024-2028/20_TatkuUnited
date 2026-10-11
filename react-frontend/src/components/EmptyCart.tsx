function EmptyCart() {
    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center">

            <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-4xl mb-6">
                🛒
            </div>

            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                Your cart is empty
            </h2>

            <p className="text-slate-500 mb-6">
                Browse our services and add something to get started.
            </p>

            <button
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg cursor-pointer transition"
            >
                Browse Services
            </button>

        </div>
    );
}

export default EmptyCart;