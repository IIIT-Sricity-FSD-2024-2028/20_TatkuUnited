import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getServiceById, getServices, getAvailableSlots, type AvailableSlotItem } from "@/services/services.service";
import { getUserAddresses, addUserAddress, addCartItem, setCartAddress } from "@/services/users.service";
import { getStoredUser, getStoredUserId } from "@/common/services/authService";
import { useAuthContext } from "@/common/AuthContext";
import type { ServiceDocument, UserAddress } from "@/models/api.models";
import { MapPin, Calendar, Clock, Plus, CheckCircle2, AlertCircle } from "lucide-react";

function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function SchedulePage() {
  const navigate = useNavigate();
  const params = useParams<{ service_id?: string; serviceId?: string }>();
  const [searchParams] = useSearchParams();
  const authContext = useAuthContext();

  const serviceIdParam = params.service_id || params.serviceId || searchParams.get("serviceId") || searchParams.get("id");

  const [selectedService, setSelectedService] = useState<ServiceDocument | null>(null);
  const [loadingService, setLoadingService] = useState(true);

  // Addresses state
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "Home",
    line: "",
    city: "Bengaluru",
    coordinates: [77.5946, 12.9716] as [number, number],
  });
  const [savingAddress, setSavingAddress] = useState(false);

  // Slot and date state
  const today = getLocalDateString(new Date());
  const latestDateObj = new Date();
  latestDateObj.setDate(latestDateObj.getDate() + 2); // 3 day booking window
  const maxDate = getLocalDateString(latestDateObj);

  const [date, setDate] = useState<string>("");
  const [slots, setSlots] = useState<AvailableSlotItem[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlotItem | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotMessage, setSlotMessage] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const storedUser = getStoredUser();
  const customerId =
    authContext.authDetails?.user?.id ||
    (authContext.authDetails?.user as any)?._id ||
    getStoredUserId() ||
    storedUser?.id ||
    storedUser?._id;

  // Protect route & check auth
  useEffect(() => {
    if (!customerId) {
      navigate("/auth/login");
    }
  }, [customerId, navigate]);

  // Load Service details
  useEffect(() => {
    let isMounted = true;
    async function loadService() {
      setLoadingService(true);
      setError("");
      try {
        if (serviceIdParam) {
          const svc = await getServiceById(serviceIdParam);
          if (isMounted) setSelectedService(svc);
        } else {
          const allServices = await getServices();
          if (isMounted && allServices.length > 0) {
            setSelectedService(allServices[0]);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Failed to load service:", err);
          setError("Service could not be loaded. Please return to catalog.");
        }
      } finally {
        if (isMounted) setLoadingService(false);
      }
    }
    loadService();
    return () => {
      isMounted = false;
    };
  }, [serviceIdParam]);

  // Load Saved Addresses
  const fetchAddresses = async () => {
    if (!customerId) return;
    setLoadingAddresses(true);
    try {
      const addrs = await getUserAddresses(customerId);
      const list = Array.isArray(addrs) ? addrs : [];
      setAddresses(list);
      if (list.length > 0 && !selectedAddressId) {
        setSelectedAddressId((list[0] as any).id || (list[0] as any)._id);
      }
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [customerId]);

  // Fetch slots whenever address or date changes
  useEffect(() => {
    let isMounted = true;
    async function loadSlots() {
      if (!selectedService?._id || !selectedAddressId || !date) {
        setSlots([]);
        setSelectedSlot(null);
        setSlotMessage("");
        return;
      }

      const chosenAddr = addresses.find(
        (a: any) => a.id === selectedAddressId || a._id === selectedAddressId,
      );
      const coords = chosenAddr?.location?.coordinates;

      setLoadingSlots(true);
      setSlotMessage("");
      setSelectedSlot(null);
      try {
        const resp = await getAvailableSlots(selectedService._id, {
          date,
          addressId: selectedAddressId,
          customerId,
          lng: coords?.[0],
          lat: coords?.[1],
        });

        if (!isMounted) return;
        setSlots(resp.slots || []);
        if (!resp.slots || resp.slots.length === 0) {
          setSlotMessage(resp.message || "No eligible providers available for this slot or date. Please choose another date.");
        }
      } catch (err: any) {
        if (!isMounted) return;
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Could not check provider availability. Please try again.";
        setSlotMessage(Array.isArray(msg) ? msg.join(", ") : msg);
        setSlots([]);
      } finally {
        if (isMounted) setLoadingSlots(false);
      }
    }

    loadSlots();
    return () => {
      isMounted = false;
    };
  }, [selectedService?._id, selectedAddressId, date, customerId, addresses]);

  // Handle adding new address inline
  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !newAddress.line.trim() || !newAddress.city.trim()) {
      setError("Please fill out all address fields.");
      return;
    }

    setSavingAddress(true);
    setError("");
    try {
      const generatedId = `addr-${Date.now()}`;
      await addUserAddress(customerId, {
        id: generatedId,
        label: newAddress.label,
        line: newAddress.line.trim(),
        city: newAddress.city.trim(),
        location: {
          type: "Point",
          coordinates: newAddress.coordinates,
        },
      });

      await fetchAddresses();
      setSelectedAddressId(generatedId);
      setShowAddAddress(false);
      setNewAddress({
        label: "Home",
        line: "",
        city: "Bengaluru",
        coordinates: [77.5946, 12.9716],
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save address.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSavingAddress(false);
    }
  };

  // Add to cart handler
  const handleAddToCart = async () => {
    setError("");

    if (!selectedAddressId) {
      setError("Please select a service delivery address.");
      return;
    }

    if (!date) {
      setError("Please select a date.");
      return;
    }

    if (!selectedSlot) {
      setError("Please select an available start-time slot.");
      return;
    }

    if (!selectedService?._id) {
      setError("No valid service selected.");
      return;
    }

    if (!customerId) {
      navigate("/auth/login");
      return;
    }

    const startTime = selectedSlot.startTime;
    const duration = selectedService.duration || 60;
    const endTime = startTime + duration;
    const scheduledDate = new Date(`${date}T00:00:00.000Z`).toISOString();

    setSubmitting(true);
    try {
      // 1. Add item to cart
      await addCartItem(customerId, {
        service: selectedService._id,
        scheduledDate,
        startTime,
        endTime,
      });

      // 2. Ensure cart.address is set to the chosen address
      try {
        await setCartAddress(customerId, selectedAddressId);
      } catch (addrErr) {
        console.warn("Could not set cart address explicitly:", addrErr);
      }

      // 3. Navigate to /customer/cart per Section 1 workflow
      navigate("/customer/cart");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to add service to cart. Please try again.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const chosenAddressObj = addresses.find(
    (a: any) => a.id === selectedAddressId || a._id === selectedAddressId,
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Schedule Service
        </h1>
        <p className="mt-2 text-slate-600">
          Select your address, preferred date, and verified provider time slot.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 flex items-start gap-3 shadow-sm"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main scheduling flow */}
        <div className="lg:col-span-2 space-y-8">
          {/* Step 1: Delivery Address */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-sm">
                  1
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Select Delivery Address
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAddress(!showAddAddress)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {showAddAddress ? "Cancel" : "Add Address"}
              </button>
            </div>

            {showAddAddress && (
              <form
                onSubmit={handleAddNewAddress}
                className="mb-6 p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3"
              >
                <h3 className="text-sm font-semibold text-blue-900">
                  New Delivery Address
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      value={newAddress.label}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, label: e.target.value })
                      }
                      placeholder="Home, Office, Apartment"
                      className="w-full text-sm rounded-lg border border-slate-300 p-2 focus:outline-none focus:border-blue-500 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={newAddress.city}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, city: e.target.value })
                      }
                      placeholder="City"
                      className="w-full text-sm rounded-lg border border-slate-300 p-2 focus:outline-none focus:border-blue-500 bg-white"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Street Address Line
                  </label>
                  <input
                    type="text"
                    value={newAddress.line}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, line: e.target.value })
                    }
                    placeholder="Flat / House No., Landmark, Area"
                    className="w-full text-sm rounded-lg border border-slate-300 p-2 focus:outline-none focus:border-blue-500 bg-white"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(false)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="px-4 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                  >
                    {savingAddress ? "Saving..." : "Save Address"}
                  </button>
                </div>
              </form>
            )}

            {loadingAddresses ? (
              <div className="py-6 text-center text-sm text-slate-500">
                Loading saved addresses...
              </div>
            ) : addresses.length === 0 ? (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm">
                No saved delivery addresses found. Please click <strong>"Add Address"</strong> above to continue.
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr: any) => {
                  const addrId = addr.id || addr._id;
                  const isSelected = selectedAddressId === addrId;
                  return (
                    <label
                      key={addrId}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border-2 transition cursor-pointer ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/30"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery-address"
                        value={addrId}
                        checked={isSelected}
                        onChange={() => setSelectedAddressId(addrId)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {addr.label || "Address"}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                            {addr.city}
                          </span>
                        </div>
                        <p className="text-slate-600 text-xs mt-0.5">
                          {addr.line}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </section>

          {/* Step 2: Date & Available Slots */}
          <section
            className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition ${
              !selectedAddressId ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-sm">
                2
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Select Date & Time Slot
                </h2>
                {!selectedAddressId && (
                  <p className="text-xs text-amber-700">
                    Please select an address first to load verified provider slots.
                  </p>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label
                htmlFor="service-date"
                className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4 text-blue-600" />
                Service Date
              </label>
              <input
                id="service-date"
                type="date"
                value={date}
                min={today}
                max={maxDate}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSelectedSlot(null);
                }}
                disabled={!selectedAddressId}
                className="w-full sm:w-64 rounded-xl border-2 border-slate-200 p-3 text-sm focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Bookings available today and the next 2 days ({today} to {maxDate}).
              </p>
            </div>

            {/* Time Slot Grid */}
            {date && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Available Start Times
                </label>

                {loadingSlots ? (
                  <div className="p-8 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-2">
                    <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    Finding available professionals in your neighborhood...
                  </div>
                ) : slotMessage ? (
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm">
                    {slotMessage}
                  </div>
                ) : slots.length === 0 ? (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-sm">
                    No slots currently open for this date.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                    {slots.map((slot) => {
                      const isSelected = selectedSlot?.startTime === slot.startTime;
                      return (
                        <button
                          key={slot.startTime}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2.5 text-center rounded-xl border-2 text-sm font-medium transition cursor-pointer ${
                            isSelected
                              ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                              : "border-slate-200 hover:border-blue-300 text-slate-800 bg-slate-50/50"
                          }`}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Summary Sidebar */}
        <div>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sticky top-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
              Booking Summary
            </h2>

            {loadingService ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Loading service info...
              </div>
            ) : selectedService ? (
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-xs uppercase font-semibold text-slate-400">
                    Service
                  </span>
                  <p className="font-bold text-slate-900 text-base">
                    {selectedService.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Duration: {selectedService.duration} mins
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs uppercase font-semibold text-slate-400">
                    Delivery Address
                  </span>
                  {chosenAddressObj ? (
                    <div className="mt-1 flex items-start gap-1.5 text-slate-800">
                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">{chosenAddressObj.label}</p>
                        <p className="text-xs text-slate-500">
                          {chosenAddressObj.line}, {chosenAddressObj.city}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-xs mt-1">
                      No address selected yet
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs uppercase font-semibold text-slate-400">
                    Scheduled Time
                  </span>
                  {date && selectedSlot ? (
                    <div className="mt-1 text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">
                        {date} at {selectedSlot.time}
                      </span>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-xs mt-1">
                      Choose date & time slot
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="font-semibold text-slate-700">List Price</span>
                  <span className="text-2xl font-black text-blue-600">
                    ₹{Math.round(selectedService.price / 100)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={submitting || !selectedAddressId || !date || !selectedSlot}
                  className="w-full mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Adding to Cart...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Add to Cart
                    </>
                  )}
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Service not available.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default SchedulePage;
