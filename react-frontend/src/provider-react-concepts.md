# Provider React Concepts: Code Examples

This document contains examples taken from the provider application codebase.

## 1. React Components, Props, and Communication

### Provider layout renders child pages

File: [`pages/provider/provider_layout.tsx`](./pages/provider/provider_layout.tsx)

`ProviderLayout` keeps the sidebar and header visible. The active provider page is rendered through `Outlet`.

```tsx
export default function ProviderLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <SideBar>
        <SidebarItem
          icon={<BsListTask />}
          label="Assigned Jobs"
          to={`${UrlMap.provider}/assigned-jobs`}
        />
        <SidebarItem
          icon={<BsPerson />}
          label="Profile"
          to={`${UrlMap.provider}/profile`}
        />
      </SideBar>

      <div className="flex w-full flex-1 flex-col">
        <UserHeader header="Provider Dashboard" />
        <main className="h-full w-full overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

### Props passed to a reusable table

File: [`pages/provider/DataTable.tsx`](./pages/provider/DataTable.tsx)

`DataTable` receives its data and column definitions through props. It is generic, so it can be reused with different row types.

```tsx
export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey?: keyof T;
}

export default function DataTable<T>({
  columns,
  data,
  rowKey,
}: DataTableProps<T>) {
  return (
    <table className="w-full text-left">
      <tbody>
        {data.map((row, index) => (
          <tr key={rowKey ? String(row[rowKey]) : index}>
            {columns.map((column) => (
              <td key={String(column.key)}>
                {column.render
                  ? column.render(row[column.key], row)
                  : String(row[column.key] ?? "")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

The provider passes the table props from `AssignedJobs.tsx`:

```tsx
<DataTable columns={columns} data={jobs} rowKey="bookingId" />
```

### Callback communication inside table columns

File: [`pages/provider/AssignedJobs.tsx`](./pages/provider/AssignedJobs.tsx)

The column renderer receives the current row and calls a provider event handler with that row's booking ID.

```tsx
render: (_, row) =>
  row.canStartJob ? (
    <button
      onClick={() => void startJob(row.bookingId)}
      type="button"
    >
      Start job
    </button>
  ) : row.canRequestCompletion ? (
    <button
      onClick={() => void requestCompletion(row.bookingId)}
      type="button"
    >
      Mark completed
    </button>
  ) : (
    <span>
      {row.status === "completion_requested"
        ? "Awaiting customer"
        : "—"}
    </span>
  ),
```

## 2. State Management and Event Handling

File: [`pages/provider/AssignedJobs.tsx`](./pages/provider/AssignedJobs.tsx)

The page stores jobs, loading state, and error state with `useState`.

```tsx
const [jobs, setJobs] = useState<Job[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

An event handler calls the API and updates only the affected job in local state:

```tsx
const startJob = async (bookingId: string) => {
  try {
    setError(null);
    await startBooking(bookingId);
    setJobs((current) =>
      current.map((job) =>
        job.bookingId === bookingId
          ? {
              ...job,
              status: "in_progress",
              canStartJob: false,
              canRequestCompletion: true,
            }
          : job,
      ),
    );
  } catch (startError) {
    setError(
      startError instanceof Error
        ? startError.message
        : "Unable to start this job.",
    );
  }
};
```

This demonstrates:

- Event handling with `onClick`
- Calling an asynchronous API function
- Updating React state immutably with `map`
- Handling success and failure

## 3. Controlled Forms

File: [`pages/provider/Profile.tsx`](./pages/provider/Profile.tsx)

The profile form values are stored in React state:

```tsx
interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
}

const [form, setForm] = useState<ProfileForm>(emptyForm);
```

The input is controlled because its `value` comes from state and its `onChange` updates that state:

```tsx
const updateField = (field: keyof ProfileForm, value: string) => {
  setForm((current) => ({ ...current, [field]: value }));
};
```

```tsx
<Input
  id={`profile-${key}`}
  type={type}
  value={form[key]}
  disabled={!editing || saving}
  onChange={(event) => updateField(key, event.target.value)}
/>
```

The save button is disabled unless the form is in edit mode or while a save request is running:

```tsx
<Button
  type="button"
  onClick={() => void handleSave()}
  disabled={!editing || saving}
>
  {saving ? "Saving..." : "Save"}
</Button>
```

## 4. `useEffect` and Side Effects

### Loading the provider profile

File: [`pages/provider/Profile.tsx`](./pages/provider/Profile.tsx)

The effect runs when the authentication details change. It loads the latest user profile from the backend.

```tsx
useEffect(() => {
  const user = authDetails?.user;
  if (!user) {
    setLoading(false);
    return;
  }

  const userId = user.id;

  async function loadProfile() {
    try {
      const latestUser = await getUserById(userId);
      setProfile(latestUser);
      setForm(formFromUser(latestUser));
    } catch {
      setError("Unable to load the latest profile details.");
    } finally {
      setLoading(false);
    }
  }

  void loadProfile();
}, [authDetails]);
```

### Loading provider jobs

File: [`pages/provider/AssignedJobs.tsx`](./pages/provider/AssignedJobs.tsx)

```tsx
useEffect(() => {
  const user = authDetails?.user;
  if (!user || user.role !== RolesEnum.PROVIDER) {
    setLoading(false);
    return;
  }

  async function fetchJobs() {
    try {
      const provider = await getProviderByUser(user.id);
      const bookings = (await getBookingsByProvider(provider._id)) as unknown as Booking[];

      setJobs(
        bookings.map((booking) => ({
          bookingId: booking._id,
          serviceName: booking.service?.name ?? "Unknown service",
          customerName: booking.customer?.name ?? "Unknown customer",
          serviceAddress: [
            booking.order?.address?.line,
            booking.order?.address?.city,
          ]
            .filter(Boolean)
            .join(", "),
          scheduledDate: formatDate(booking.scheduledDate),
          startTime: formatTime(booking.startTime),
          status: booking.status,
          canStartJob: booking.status === "confirmed",
          canRequestCompletion: booking.status === "in_progress",
        })),
      );
    } finally {
      setLoading(false);
    }
  }

  void fetchJobs();
}, [authDetails]);
```

The side effects are:

- Calling the backend
- Updating loading state
- Updating jobs state
- Handling API errors

## 5. Authentication with `AuthContext`

### Context definition

File: [`common/AuthContext.ts`](./common/AuthContext.ts)

```tsx
export interface AuthContextInterface {
  authDetails: AuthInterface | null;
  setAuthDetails: React.Dispatch<
    React.SetStateAction<AuthInterface | null>
  >;
}

const AuthContext = createContext<AuthContextInterface | null>(null);

export function useAuthContext(): AuthContextInterface {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuthContext must be used within AuthContext.Provider",
    );
  }
  return context;
}
```

### Providing authentication data

File: [`App.tsx`](./App.tsx)

The application initializes authentication from session storage and provides it to the whole React tree:

```tsx
const [authDetails, setAuthDetails] =
  useState<AuthInterface | null>(() => {
    try {
      const token = sessionStorage.getItem("token");
      const userStr = sessionStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;

      if (token) {
        return { token, user };
      }
    } catch {
      // ignore parse errors
    }

    return null;
  });
```

```tsx
<AuthContext.Provider value={{ authDetails, setAuthDetails }}>
  <BrowserRouter>
    {/* application routes */}
  </BrowserRouter>
</AuthContext.Provider>
```

### Using authentication in provider pages

File: [`pages/provider/AssignedJobs.tsx`](./pages/provider/AssignedJobs.tsx)

```tsx
const { authDetails } = useAuthContext();

const user = authDetails?.user;
if (!user || user.role !== RolesEnum.PROVIDER) {
  setLoading(false);
  return;
}

const provider = await getProviderByUser(user.id);
```

The authenticated user ID is used to find the provider document before loading provider-specific bookings.

## 6. Provider Role Protection

File: [`pages/components/protectedRoute.tsx`](./pages/components/protectedRoute.tsx)

The provider router is protected with the provider role:

```tsx
<ProtectedRoute allowedRoles={[RolesEnum.PROVIDER]}>
  <Routes>
    {/* provider routes */}
  </Routes>
</ProtectedRoute>
```

`ProtectedRoute` redirects unauthenticated users and blocks users with another role:

```tsx
const { user, isAuthenticated } = useAuth();

useEffect(() => {
  if (!isAuthenticated) {
    navigate("/auth/login", { replace: true });
  }
}, [isAuthenticated, navigate]);

if (!isAuthenticated) {
  return null;
}

if (user && allowedRoles.includes(user.role)) {
  return <>{children}</>;
}

return <ForbiddenAccess />;
```

## Viva Summary

- **Components and props:** `ProviderLayout`, `DataTable`, `SidebarItem`, and provider pages are separate components. `DataTable` receives `columns` and `data` as props.
- **State and events:** `useState` stores jobs and form data. Button `onClick` handlers call APIs and update state.
- **Controlled forms:** Profile inputs use `value` from `form` state and update it through `onChange`.
- **`useEffect`:** Provider pages load profile and booking data after authentication data is available.
- **Authentication:** `AuthContext` shares the logged-in user and token. `ProtectedRoute` enforces authentication and provider role access.
