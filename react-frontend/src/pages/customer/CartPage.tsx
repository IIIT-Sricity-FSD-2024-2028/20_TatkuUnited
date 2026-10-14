import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CartList from "../../components/CartList";
import CartSummary from "../../components/CartSummary";
import EmptyCart from "../../components/EmptyCart";
import PublicNavbar from "../PublicNavbar";
import Footer from "../general/landing/Footer";
import { useAuthContext } from "@/common/AuthContext";
import { getStoredUser, getStoredUserId } from "@/common/services/authService";
import {
  getUserCart,
  removeCartItem,
} from "@/services/users.service";
import { checkoutCart } from "@/services/orders.service";
import type {
  BackendCart,
  ServiceDocument,
} from "@/models/api.models";

interface CartItemData {
  id: number;
  serviceName: string;
  location: string;
  schedule: string;
  price: number;
}

function formatSlotTime(minutesFromMidnight: number): string {
  const hours = Math.floor(minutesFromMidnight / 60);
  const mins = minutesFromMidnight % 60;
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${String(mins).padStart(2, "0")} ${ampm}`;
}

function formatBookingDate(dateVal?: string | Date): string {
  if (!dateVal) return "Scheduled date";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(dateVal);
  }
}

function CartPage() {
  const navigate = useNavigate();
  const authContext = useAuthContext();

  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const storedUser = getStoredUser();
  const customerId =
    authContext.authDetails?.user?.id ||
    (authContext.authDetails?.user as any)?._id ||
    getStoredUserId() ||
    storedUser?.id ||
    storedUser?._id;

  const transformCartItems = (cart: BackendCart): CartItemData[] => {
    if (!cart?.items || !Array.isArray(cart.items)) return [];
    return cart.items.map((item, index) => {
      const svc =
        typeof item.service === "object" && item.service !== null
          ? (item.service as ServiceDocument)
          : null;
      const serviceName = svc?.name || "Scheduled Service";
      const priceInPaise = typeof svc?.price === "number" ? svc.price : 0;
      const priceInRupees = Math.round(priceInPaise / 100);
      const dateStr = formatBookingDate(item.scheduledDate);
      const timeStr = `${formatSlotTime(item.startTime)} - ${formatSlotTime(item.endTime)}`;
      return {
        id: index,
        serviceName,
        location: "Sri City",
        schedule: `${dateStr} at ${timeStr}`,
        price: priceInRupees,
      };
    });
  };

  const fetchCart = async () => {
    if (!customerId) {
      setError("Please log in to view your cart.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const cart = await getUserCart(customerId);
      setCartItems(transformCartItems(cart));
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load your cart from the server. Please try again.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [customerId]);

  const handleRemoveItem = async (index: number) => {
    if (!customerId) return;
    setError("");
    try {
      const updatedCart = await removeCartItem(customerId, index);
      setCartItems(transformCartItems(updatedCart));
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to remove item from your cart. Please try again.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;

  const handleCheckout = async () => {
    if (!customerId || cartItems.length === 0 || isCheckingOut) return;
    setIsCheckingOut(true);
    setError("");
    try {
      const resp = await checkoutCart();
      // Per Section 2, step 5: Return {orderId, amount}. Front-end goes to /customer/pay/:orderId
      navigate(`/customer/pay/${resp.orderId}`);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Checkout failed. Unable to place order. Please try again.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <PublicNavbar
          brandName="TatkuUnited"
          brandInitials="TU"
          onNavigate={(path) => navigate(path)}
        />

        <main className="max-w-6xl mx-auto px-6 pt-32 pb-16">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Your Cart</h1>

            <p className="text-slate-500 mt-2">
              {loading
                ? "Loading your cart from server..."
                : cartItems.length > 0
                ? `${cartItems.length} scheduled service${
                    cartItems.length > 1 ? "s" : ""
                  } in your cart`
                : "Your cart is empty"}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p>{error}</p>
                {error.includes("address") && (
                  <button
                    type="button"
                    onClick={() => navigate("/account-settings")}
                    className="self-start rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer"
                  >
                    Go to Account Settings
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Cart Contents */}
          {loading ? (
            <div
              role="status"
              className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500"
            >
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-3" />
              <p>Loading your cart from backend...</p>
            </div>
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
                  onCheckout={handleCheckout}
                  isCheckingOut={isCheckingOut}
                  disabled={cartItems.length === 0 || loading || isCheckingOut}
                />
              </div>
            </div>
          ) : (
            <EmptyCart />
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}

export default CartPage;
