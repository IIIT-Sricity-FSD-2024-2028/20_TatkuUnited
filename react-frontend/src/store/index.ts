import { setApiTokenSource } from "@/common/services/apiService";
import { persistSession } from "@/common/services/sessionStorage";
import { configureStore } from "@reduxjs/toolkit";
import { AuthReducer } from "./auth/auth-slice";
import { managerReducer } from "./manager/manager-slice";
import { customerReducer } from "./customer/customer-slice";
import { bookingReducer } from "./booking/booking-slice";
import { categoryReducer } from "./category/category-slice";
import { platformReducer } from "./platform-setting/platform-slice";
import { providerReducer } from "./provider/provider-slice";
import { regionReducer } from "./region/region-slice";
import { reviewReducer } from "./review/review-slice";
import { serviceReducer } from "./service/service-slice";
import { superuserReducer } from "./superuser/superuser-slice";

export const store = configureStore({
    devTools: true,
    reducer: {
        auth: AuthReducer,
        booking: bookingReducer,
        category: categoryReducer,
        customer: customerReducer,
        manager: managerReducer,
        platform: platformReducer,
        provider: providerReducer,
        region: regionReducer,
        review: reviewReducer,
        service: serviceReducer,
        superuser: superuserReducer,
    },
});

setApiTokenSource(() => store.getState().auth.token);
let previousAuth = store.getState().auth;
store.subscribe(() => {
    const auth = store.getState().auth;
    if (auth === previousAuth) return;
    previousAuth = auth;
    persistSession(auth.user && auth.token ? { user: auth.user, token: auth.token } : null);
});

if (typeof window !== "undefined") {
    (window as unknown as { store: typeof store }).store = store;
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
