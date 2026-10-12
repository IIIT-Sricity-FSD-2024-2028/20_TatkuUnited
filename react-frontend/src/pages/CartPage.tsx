import { useEffect, useState } from "react";
import CartList from "../components/CartList";
import CartSummary from "../components/CartSummary";
import EmptyCart from "../components/EmptyCart";

interface CartItemData {
    id: number;
    serviceName: string;
    location: string;
    schedule: string;
    price: number;
}

function CartPage() {
    const [cartItems, setCartItems] = useState<CartItemData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        try {
            const storedItems: unknown = JSON.parse(
                localStorage.getItem("cartItems") || "[]",
            );
            if (!Array.isArray(storedItems)) {
                throw new Error("Cart data is invalid.");
            }
            setCartItems(storedItems);
        } catch {
            setError("Unable to load your cart. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleRemoveItem = (id: number) => {
        const updatedItems = cartItems.filter((item) => item.id !== id);
        try {
            localStorage.setItem("cartItems", JSON.stringify(updatedItems));
            setCartItems(updatedItems);
            setError("");
        } catch {
            setError("Unable to update your cart. Please try again.");
        }
    };

    const subtotal = cartItems.reduce(
        (sum, item) => sum + item.price,
        0
    );

    const gst = Math.round(subtotal * 0.18);
    const total = subtotal + gst;

    return (
        <div className="min-h-screen bg-slate-50">
            <main className="max-w-6xl mx-auto px-6 py-10">

                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Your Cart
                    </h1>

                    <p className="text-slate-500 mt-2">
                        {loading
                            ? "Loading your cart..."
                            : cartItems.length > 0
                            ? `${cartItems.length} service${cartItems.length > 1 ? "s" : ""} in your cart`
                            : "Your cart is empty"}
                    </p>
                </div>

                {error && (
                    <p role="alert" className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
                        {error}
                    </p>
                )}

                {/* Cart */}
                {loading ? (
                    <p role="status" className="rounded-xl border bg-white p-8 text-center">
                        Loading your cart...
                    </p>
                ) : cartItems.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Cart Items */}
                        <div className="lg:col-span-2">
                            <CartList
                                items={cartItems}
                                onRemoveItem={handleRemoveItem}
                            />
                        </div>

                        {/* Summary */}
                        <div>
                            <CartSummary
                                subtotal={subtotal}
                                gst={gst}
                                total={total}
                            />
                        </div>

                    </div>
                ) : (
                    <EmptyCart />
                )}

            </main>
        </div>
    );
}

export default CartPage;
