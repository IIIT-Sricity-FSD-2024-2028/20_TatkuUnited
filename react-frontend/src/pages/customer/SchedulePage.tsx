import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import {
  CustomerActions,
  addAddress,
  addToCart,
  fetchAddresses,
} from "@/store/customer/customer-slice";
import {
  ServiceActions,
  fetchAvailableSlots,
  fetchServiceById,
  fetchServices,
} from "@/store/service/service-slice";
import type { AvailableSlotItem } from "@/services/services.service";
import {
  MapPin,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { getLocalDateString, isDateInRange } from "@/lib/dateValidation";
import { CitySelect } from "@/components/shared/CitySelect";
import { LocationPicker } from "@/components/shared/LocationPicker";
import { SUPPORTED_CITIES } from "@/common/cities";

function SchedulePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams<{ service_id?: string; serviceId?: string }>();
  const [searchParams] = useSearchParams();

  const serviceIdParam =
    params.service_id ||
    params.serviceId ||
    searchParams.get("serviceId") ||
    searchParams.get("id");

  // all data comes from the store
  const customerId = useSelector((state: RootState) => state.auth.user?.id);
  const {
    selectedService,
    loading: loadingService,
    slots,
    slotsMessage: slotMessage,
    slotsLoading: loadingSlots,
    error: serviceError,
  } = useSelector((state: RootState) => state.service);
  const {
    addresses,
    pending,
    error: customerError,
  } = useSelector((state: RootState) => state.customer);
  const loadingAddresses = pending > 0 && addresses.length === 0;

  // form / selection state only (not server data)
  const [savingAddress, setSavingAddress] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "Home",
    line: "",
    city: "Bengaluru",
    coordinates: [77.5946, 12.9716] as [number, number],
  });
  const [cityCenterHint, setCityCenterHint] = useState<[number, number]>(
    SUPPORTED_CITIES[0].coordinates,
  );
  const today = getLocalDateString(new Date());
  const latestDateObj = new Date();
  latestDateObj.setDate(latestDateObj.getDate() + 2); // 3 day booking window
  const maxDate = getLocalDateString(latestDateObj);

  const [date, setDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlotItem | null>(
    null,
  );
  const [formError, setFormError] = useState("");
  const error = formError || customerError || serviceError || "";

  // Protect route & check auth
  useEffect(() => {
    if (!customerId) navigate("/auth/login");
  }, [customerId, navigate]);

  // Load the service and the saved addresses into the store
  useEffect(() => {
    dispatch(CustomerActions.clearError());
    if (serviceIdParam) {
      dispatch(fetchServiceById(serviceIdParam));
    } else {
      dispatch(fetchServices(false))
        .unwrap()
        .then((all) => {
          dispatch(ServiceActions.selectService(all[0] ?? null));
        })
        .catch(() => {});
    }
  }, [dispatch, serviceIdParam]);

  useEffect(() => {
    if (!customerId) return;
    dispatch(fetchAddresses());
  }, [dispatch, customerId]);

  // Pre-select the first saved address
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      setSelectedAddressId(
        (addresses[0] as any).id || (addresses[0] as any)._id,
      );
    }
  }, [addresses, selectedAddressId]);

  // Fetch slots whenever address or date changes
  useEffect(() => {
    setSelectedSlot(null);
    if (
      !selectedService?._id ||
      !selectedAddressId ||
      !date ||
      !isDateInRange(date, today, maxDate)
    ) {
      dispatch(ServiceActions.clearSlots());
      return;
    }
    const chosenAddr = addresses.find(
      (a: any) => a.id === selectedAddressId || a._id === selectedAddressId,
    );
    const coords = chosenAddr?.location?.coordinates;
    dispatch(
      fetchAvailableSlots({
        serviceId: selectedService._id,
        params: {
          date,
          addressId: selectedAddressId,
          customerId,
          lng: coords?.[0],
          lat: coords?.[1],
        },
      }),
    );
  }, [
    dispatch,
    selectedService?._id,
    selectedAddressId,
    date,
    customerId,
    addresses,
  ]);

  // Handle adding new address inline
  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !customerId ||
      !newAddress.label.trim() ||
      !newAddress.line.trim() ||
      !newAddress.city.trim()
    ) {
      setFormError("Please fill out all address fields.");
      return;
    }

    setSavingAddress(true);
    setFormError("");
    try {
      const generatedId = `addr-${Date.now()}`;
      await dispatch(
        addAddress({
          id: generatedId,
          label: newAddress.label,
          line: newAddress.line.trim(),
          city: newAddress.city.trim(),
          location: {
            type: "Point",
            coordinates: newAddress.coordinates,
          },
        }),
      ).unwrap();
      setSelectedAddressId(generatedId);
      setShowAddAddress(false);
      setNewAddress({
        label: "Home",
        line: "",
        city: "Bengaluru",
        coordinates: [77.5946, 12.9716],
      });
    } catch {
      // the message is in state.customer.error
    } finally {
      setSavingAddress(false);
    }
  };

  // Add to cart handler
  const handleAddToCart = async () => {
    setFormError("");

    if (!selectedAddressId) {
      setFormError("Please select a service delivery address.");
      return;
    }
    if (!date) {
      setFormError("Please select a date.");
      return;
    }
    if (!isDateInRange(date, today, maxDate)) {
      setFormError(
        `Please select a valid date between ${today} and ${maxDate}.`,
      );
      return;
    }
    if (!selectedSlot) {
      setFormError("Please select an available start-time slot.");
      return;
    }
    if (!selectedService?._id) {
      setFormError("No valid service selected.");
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
      await dispatch(
        addToCart({
          item: {
            service: selectedService._id,
            scheduledDate,
            startTime,
            endTime,
          },
          addressId: selectedAddressId,
        }),
      ).unwrap();
      // Per Section 1 workflow
      navigate("/customer/cart");
    } catch {
      // the message is in state.customer.error
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
                    <CitySelect
                      value={newAddress.city}
                      onChange={(cityOption) => {
                        setNewAddress((prev) => ({
                          ...prev,
                          city: cityOption.name,
                          coordinates: cityOption.coordinates,
                        }));
                        setCityCenterHint(cityOption.coordinates);
                      }}
                      required
                    />
                  </div>
                </div>
                <LocationPicker
                  value={newAddress.coordinates}
                  centerHint={cityCenterHint}
                  heightClass="h-52"
                  label="Pin Delivery Location or Use Live Location"
                  onChange={(coords, resolved) => {
                    setNewAddress((prev) => ({
                      ...prev,
                      coordinates: coords,
                      city: resolved?.city ?? prev.city,
                      line: resolved?.addressLine || prev.line,
                    }));
                  }}
                />
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
                No saved delivery addresses found. Please click{" "}
                <strong>"Add Address"</strong> above to continue.
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
                    Please select an address first to load verified provider
                    slots.
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
                  const nextDate = e.target.value;
                  setDate(nextDate);
                  setSelectedSlot(null);
                  if (nextDate && !isDateInRange(nextDate, today, maxDate)) {
                    setFormError(
                      `Please select a valid date between ${today} and ${maxDate}.`,
                    );
                  } else {
                    setFormError("");
                  }
                }}
                disabled={!selectedAddressId}
                className="w-full sm:w-64 rounded-xl border-2 border-slate-200 p-3 text-sm focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Bookings available today and the next 2 days ({today} to{" "}
                {maxDate}).
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
                      const isSelected =
                        selectedSlot?.startTime === slot.startTime;
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
                  <span className="font-semibold text-slate-700">
                    List Price
                  </span>
                  <span className="text-2xl font-black text-blue-600">
                    ₹{Math.round(selectedService.price / 100)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={
                    submitting || !selectedAddressId || !date || !selectedSlot
                  }
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
