import { useState } from "react";
import CartList from "../components/CartList";
import CartSummary from "../components/CartSummary";
import EmptyCart from "../components/EmptyCart";

function CartPage() {
    const [cartItems, setCartItems] = useState([
        {
            id: 1,
            serviceName: "Home Cleaning",
            location: "Sri City",
            schedule: "Instant Booking",
            price: 500,
        },
        {
            id: 2,
            serviceName: "AC Repair",
            location: "Sri City",
            schedule: "Scheduled for Aug 30, 2026",
            price: 800,
        },
    ]);

    const handleRemoveItem = (id: number) => {
        setCartItems((items) =>
            items.filter((item) => item.id !== id)
        );
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
                        {cartItems.length > 0
                            ? `${cartItems.length} service${cartItems.length > 1 ? "s" : ""} in your cart`
                            : "Your cart is empty"}
                    </p>
                </div>

                {/* Cart */}
                {cartItems.length > 0 ? (
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