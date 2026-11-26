import { createSlice, isFulfilled, isPending, isRejected } from "@reduxjs/toolkit";
import createAsyncThunkTyped from "../asyncThunk";
import { errorMessage } from "../errorMessage";
import {
  addCartItem,
  addUserAddress,
  deleteUserAddress,
  getMe,
  getUserAddresses,
  getUserCart,
  removeCartItem,
  setCartAddress,
  updateUser,
} from "@/services/users.service";
import { apiService } from "@/common/services/apiService";
import { HTTP_METHODS_ENUM } from "@/common/http.methods";
import { ENDPOINT_ENUM } from "@/common/endpoints";
import {
  checkoutCart,
  getOrderDetails,
  type CheckoutResponse,
  type OrderDetails,
} from "@/services/orders.service";
import { simulatePayment } from "@/services/payments.service";
import { AuthActions } from "../auth/auth-slice";
import type { RootState } from "..";
import type {
  AddCartItemDto,
  BackendCart,
  UserAddress,
  UpdateUserDto,
  UserDocument,
} from "@/models/api.models";

interface CustomerState {
  profile: UserDocument | null;
  cart: BackendCart | null;
  addresses: UserAddress[];
  /** the order shown on the payment page */
  currentOrder: OrderDetails | null;
  /** number of in-flight read requests (drives loading spinners) */
  pending: number;
  checkingOut: boolean;
  paying: boolean;
  error: string | null;
  requestId: string | null;
}

const initialState: CustomerState = {
  profile: null,
  cart: null,
  addresses: [],
  currentOrder: null,
  pending: 0,
  checkingOut: false,
  paying: false,
  error: null,
  requestId: null,
};

/** The logged-in customer's id, from the auth slice. */
function customerIdOf(state: RootState): string {
  const id = state.auth.user?.id;
  if (!id) throw new Error("Please log in to continue.");
  return id;
}

export const fetchCustomerDetails = createAsyncThunkTyped(
  "customer/fetchCustomerDetails",
  async (): Promise<UserDocument> => {
    try {
      return await getMe();
    } catch (err) {
      throw new Error(errorMessage(err, "Fetching customer details failed"));
    }
  },
);

// ---- profile -------------------------------------------------------------

/** Save the customer's personal info, then mirror it into the auth session. */
export const updateCustomerProfile = createAsyncThunkTyped(
  "customer/updateCustomerProfile",
  async (changes: UpdateUserDto, { getState, dispatch }): Promise<UserDocument> => {
    const id = customerIdOf(getState());
    try {
      const updated = await updateUser(id, changes);
      dispatch(
        AuthActions.userUpdated({
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
        }),
      );
      return updated;
    } catch (err) {
      throw new Error(errorMessage(err, "Failed to save changes."));
    }
  },
);

/** Verify the current password against login, then set the new one. */
export const changePassword = createAsyncThunkTyped(
  "customer/changePassword",
  async (
    { currentPassword, newPassword }: { currentPassword: string; newPassword: string },
    { getState },
  ): Promise<void> => {
    const state = getState();
    const id = customerIdOf(state);
    const email = state.customer.profile?.email ?? state.auth.user?.email;
    if (!email) throw new Error("Session expired. Please log in again.");
    try {
      await apiService(HTTP_METHODS_ENUM.post, ENDPOINT_ENUM.AUTH_LOGIN, {
        email: email.trim(),
        password: currentPassword,
      });
    } catch {
      throw new Error("Current password is incorrect.");
    }
    try {
      await updateUser(id, { password: newPassword });
    } catch (err) {
      throw new Error(errorMessage(err, "Failed to change password."));
    }
  },
);

// ---- cart ----------------------------------------------------------------

export const fetchCart = createAsyncThunkTyped(
  "customer/fetchCart",
  async (_: void, { getState }): Promise<BackendCart> => {
    const id = customerIdOf(getState());
    try {
      return await getUserCart(id);
    } catch (err) {
      throw new Error(
        errorMessage(err, "Unable to load your cart from the server. Please try again."),
      );
    }
  },
);

/** Add a scheduled service to the cart, optionally attaching a delivery address. */
export const addToCart = createAsyncThunkTyped(
  "customer/addToCart",
  async (
    { item, addressId }: { item: AddCartItemDto; addressId?: string },
    { getState },
  ): Promise<BackendCart> => {
    const id = customerIdOf(getState());
    try {
      const cart = await addCartItem(id, item);
      if (!addressId) return cart;
      // the item is already in the cart, so a failure to set the address isn't fatal
      return await setCartAddress(id, addressId).catch(() => cart);
    } catch (err) {
      throw new Error(errorMessage(err, "Unable to add the service to your cart."));
    }
  },
);

export const removeFromCart = createAsyncThunkTyped(
  "customer/removeFromCart",
  async (index: number, { getState }): Promise<BackendCart> => {
    const id = customerIdOf(getState());
    try {
      return await removeCartItem(id, index);
    } catch (err) {
      throw new Error(
        errorMessage(err, "Unable to remove item from your cart. Please try again."),
      );
    }
  },
);

// ---- addresses -----------------------------------------------------------

export const fetchAddresses = createAsyncThunkTyped(
  "customer/fetchAddresses",
  async (_: void, { getState }): Promise<UserAddress[]> => {
    const id = customerIdOf(getState());
    try {
      return await getUserAddresses(id);
    } catch (err) {
      throw new Error(errorMessage(err, "Unable to load your addresses."));
    }
  },
);

export const addAddress = createAsyncThunkTyped(
  "customer/addAddress",
  async (address: UserAddress, { getState }): Promise<UserAddress[]> => {
    const id = customerIdOf(getState());
    try {
      await addUserAddress(id, address);
      return await getUserAddresses(id);
    } catch (err) {
      throw new Error(errorMessage(err, "Unable to save the address."));
    }
  },
);

export const deleteAddress = createAsyncThunkTyped(
  "customer/deleteAddress",
  async (addressId: string, { getState }): Promise<UserAddress[]> => {
    const id = customerIdOf(getState());
    try {
      await deleteUserAddress(id, addressId);
      return await getUserAddresses(id);
    } catch (err) {
      throw new Error(errorMessage(err, "Unable to delete the address."));
    }
  },
);

// ---- checkout / payment --------------------------------------------------

export const checkout = createAsyncThunkTyped(
  "customer/checkout",
  async (): Promise<CheckoutResponse> => {
    try {
      return await checkoutCart();
    } catch (err) {
      throw new Error(
        errorMessage(err, "Checkout failed. Unable to place order. Please try again."),
      );
    }
  },
);

export const fetchOrder = createAsyncThunkTyped(
  "customer/fetchOrder",
  async (orderId: string): Promise<OrderDetails> => {
    try {
      return await getOrderDetails(orderId);
    } catch (err) {
      throw new Error(errorMessage(err, "Unable to load this order."));
    }
  },
);

/** Mock-pay an order, then reload it (matching may cancel/refund immediately). */
export const payOrder = createAsyncThunkTyped(
  "customer/payOrder",
  async ({
    orderId,
    success,
  }: {
    orderId: string;
    success: boolean;
  }): Promise<OrderDetails> => {
    try {
      await simulatePayment(orderId, success);
      return await getOrderDetails(orderId);
    } catch {
      throw new Error(
        "We could not verify the payment result. Refresh the order before trying again.",
      );
    }
  },
);

// reads that drive the page-level loading spinner
const readRequests = [fetchCustomerDetails, fetchCart, fetchAddresses, fetchOrder] as const;
// every customer thunk reports its failure into state.error
const allRequests = [
  ...readRequests,
  addToCart,
  removeFromCart,
  addAddress,
  deleteAddress,
  checkout,
  payOrder,
  updateCustomerProfile,
  changePassword,
] as const;

const CustomerSlice = createSlice({
  name: "customer",
  initialState,
  reducers: {
    resetSlice: () => initialState,
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(AuthActions.login, () => initialState)
      .addCase(AuthActions.logout, () => initialState)
      .addCase(fetchCustomerDetails.pending, (state, action) => {
        state.requestId = action.meta.requestId;
      })
      .addCase(fetchCustomerDetails.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.profile = action.payload;
        state.requestId = null;
      })
      .addCase(fetchCustomerDetails.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.requestId = null;
      })
      .addCase(updateCustomerProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.cart = action.payload;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.cart = action.payload;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.cart = action.payload;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.addresses = action.payload;
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.addresses = action.payload;
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.addresses = action.payload;
      })
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.currentOrder = action.payload;
      })
      .addCase(checkout.pending, (state) => {
        state.checkingOut = true;
      })
      .addCase(checkout.fulfilled, (state) => {
        state.checkingOut = false;
        // the cart was turned into an order
        state.cart = null;
      })
      .addCase(checkout.rejected, (state) => {
        state.checkingOut = false;
      })
      .addCase(payOrder.pending, (state) => {
        state.paying = true;
      })
      .addCase(payOrder.fulfilled, (state, action) => {
        state.paying = false;
        state.currentOrder = action.payload;
      })
      .addCase(payOrder.rejected, (state) => {
        state.paying = false;
      })
      .addMatcher(isPending(...readRequests), (state) => {
        state.pending += 1;
      })
      .addMatcher(isFulfilled(...readRequests), (state) => {
        state.pending = Math.max(0, state.pending - 1);
      })
      .addMatcher(isRejected(...readRequests), (state) => {
        state.pending = Math.max(0, state.pending - 1);
      })
      .addMatcher(isPending(...allRequests), (state) => {
        state.error = null;
      })
      .addMatcher(isRejected(...allRequests), (state, action) => {
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Something went wrong";
        }
      });
  },
});

export const customerReducer = CustomerSlice.reducer;
export const customerActions = CustomerSlice.actions;
export const CustomerActions = customerActions;
