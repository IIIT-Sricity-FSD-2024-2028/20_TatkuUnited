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
  clearCart,
  getUserAddresses,
} from "@/services/users.service";
import { createOrder } from "@/services/orders.service";
import type {
  BackendCart,
  ServiceDocument,
  AddressSnapshotDto,
} from "@/models/api.models";

interface CartItemData {
  id: number;
  serviceName: string;
  location: string;
  schedule: string;
  price: number;
}

interface OrderSuccessData {
  orderId: string;
  totalAmount: number;
  paymentStatus: string;
  expiresAt: string;
  cartCleanupFailed?: boolean;
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

  const [rawCart, setRawCart] = useState<BackendCart | null>(null);
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<OrderSuccessData | null>(null);

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
      setRawCart(cart);
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
      setRawCart(updatedCart);
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
      // 1. Fetch saved addresses: do not silently fallback if missing or API fails
      let addresses;
      try {
        addresses = await getUserAddresses(customerId);
      } catch (addrErr: any) {
        const msg =
          addrErr?.response?.data?.message ||
          addrErr?.message ||
          "Unable to verify your saved delivery address. Please try again.";
        setError(Array.isArray(msg) ? msg.join(", ") : msg);
        setIsCheckingOut(false);
        return;
      }

      if (!Array.isArray(addresses) || addresses.length === 0) {
        setError(
          "No saved delivery address found. Please add a delivery address to your account before placing an order.",
        );
        setIsCheckingOut(false);
        return;
      }

      const found = rawCart?.address
        ? addresses.find(
            (a: any) =>
              a._id === rawCart.address || a.id === rawCart.address,
          )
        : addresses[0];
      const chosen = found || addresses[0];

      if (
        !chosen ||
        !chosen.line ||
        !chosen.city ||
        !chosen.location?.coordinates ||
        !Array.isArray(chosen.location.coordinates) ||
        chosen.location.coordinates.length < 2
      ) {
        setError(
          "Your selected delivery address is incomplete or missing coordinates. Please update your address in Account Settings before proceeding.",
        );
        setIsCheckingOut(false);
        return;
      }

      const addressSnapshot: AddressSnapshotDto = {
        line: chosen.line,
        city: chosen.city,
        location: {
          type: "Point",
          coordinates: [
            chosen.location.coordinates[0],
            chosen.location.coordinates[1],
          ],
        },
      };

      const totalAmountInPaise = Math.round(total * 100);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      const createdOrder = await createOrder({
        customer: customerId,
        address: addressSnapshot,
        totalAmount: totalAmountInPaise,
        expiresAt,
      });

      let cartCleanupFailed = false;
      try {
        await clearCart(customerId);
        setRawCart({ address: null, items: [] });
        setCartItems([]);
      } catch {
        cartCleanupFailed = true;
      }

      setOrderSuccess({
        orderId: createdOrder._id,
        totalAmount: createdOrder.totalAmount,
        paymentStatus: (createdOrder as any).paymentStatus || "created",
        expiresAt: createdOrder.expiresAt,
        cartCleanupFailed,
      });
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
                : orderSuccess
                ? "Your order has been placed"
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

          {/* Order Placement Success View */}
          {orderSuccess && (
            <section
              aria-label="Order confirmation"
              className="mb-8 rounded-xl border border-blue-200 bg-white p-8 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-2xl text-blue-600">
                  📋
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-slate-900">
                    Order Placed (Pending Payment)
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Order ID:{" "}
                    <span className="font-mono font-medium text-slate-900">
                      {orderSuccess.orderId}
                    </span>
                  </p>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-lg bg-slate-50 p-4 border border-slate-200">
                    <div>
                      <span className="block text-xs font-medium text-slate-500 uppercase">
                        Total Amount
                      </span>
                      <span className="text-lg font-bold text-slate-900">
                        ₹
                        {(orderSuccess.totalAmount / 100).toLocaleString(
                          "en-IN",
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-slate-500 uppercase">
                        Order Status
                      </span>
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20 mt-1">
                        Created / Pending Payment
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-slate-500 uppercase">
                        Cart Status
                      </span>
                      {orderSuccess.cartCleanupFailed ? (
                        <span className="text-sm font-semibold text-amber-700 mt-1 block">
                          Cleanup Failed
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-emerald-700 mt-1 block">
                          Cleared
                        </span>
                      )}
                    </div>
                  </div>

                  {orderSuccess.cartCleanupFailed && (
                    <div className="mt-4 rounded-lg bg-amber-50 p-4 border border-amber-200 text-sm text-amber-800">
                      <p className="font-semibold">Notice: Cart Cleanup Failed</p>
                      <p className="mt-1">
                        Your order was recorded in the system, but clearing your backend cart failed. Some items may still appear in your cart until refreshed or removed manually.
                      </p>
                    </div>
                  )}

                  <div className="mt-4 rounded-lg bg-slate-100 p-4 border border-slate-200 text-sm text-slate-700">
                    <p className="font-semibold">Payment & Booking Notice</p>
                    <p className="mt-1">
                      Your order has been recorded with status <strong>Created / Pending Payment</strong> to reserve your slots. Direct payment processing via Razorpay is awaiting gateway production credentials. No payment was charged, and bookings will only be assigned once payment is processed.
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-4">
                    <button
                      type="button"
                      onClick={() => navigate("/bookings")}
                      className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition cursor-pointer"
                    >
                      View My Bookings
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/customer")}
                      className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </section>
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
          ) : !orderSuccess ? (
            <EmptyCart />
          ) : null}
        </main>
      </div>

      <Footer />
    </div>
  );
}

export default CartPage;
