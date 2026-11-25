import { configureStore } from "@reduxjs/toolkit";
import { AuthReducer } from "./auth/auth-slice";
import { managerReducer } from "./manager/manager-slice";
import { customerReducer } from "./customer/customer-slice";
import { bookingReducer } from "./booking/booking-slice";
import { categoryReducer } from "./category/category-slice";
import { platformReducer } from "./platform-setting/platform-slice";
import { providerReducer } from "./provider/provider-slice";
import { regionReducer } from "./region/region-slice";
import { serviceReducer } from "./service/service-slice";
import { superuserReducer } from "./superuser/superuser-slice";
import { providerApi } from "./provider/provider-api";

export const store = configureStore({
    reducer: {
        auth: AuthReducer,
        booking: bookingReducer,
        category: categoryReducer,
        customer: customerReducer,
        manager: managerReducer,
        platform: platformReducer,
        provider: providerReducer,
        region: regionReducer,
        service: serviceReducer,
        superuser: superuserReducer,
        [providerApi.reducerPath]: providerApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(providerApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
