# React to NestJS API Workflow

## Goal

This document shows how a React component receives provider data from MongoDB through the existing NestJS backend, without introducing Redux.

## Complete data flow

```text
MongoDB
  -> Mongoose provider schema/model
  -> ProvidersService
  -> ProvidersController
  -> HTTP endpoint
  -> React fetch/axios
  -> JSON response
  -> useState()
  -> component rendering
```

## Provider example

For the existing providers resource:

| Operation        | HTTP method | URL                                     |
| ---------------- | ----------: | --------------------------------------- |
| List providers   |     `GET` | `http://localhost:3000/providers`     |
| Get one provider |     `GET` | `http://localhost:3000/providers/:id` |
| Create provider  |    `POST` | `http://localhost:3000/providers`     |
| Update provider  |   `PATCH` | `http://localhost:3000/providers/:id` |
| Delete provider  |  `DELETE` | `http://localhost:3000/providers/:id` |

The backend has no global `/api` prefix.

## Minimal React implementation

```tsx
import { useEffect, useState } from "react";
import { BASE_URL } from "../../services/api";

type Provider = {
  _id: string;
  user:
    | string
    | {
        _id: string;
        email?: string;
      };
  offeredServices: string[];
  experience: number;
  workHourStart: number;
  workHourEnd: number;
  workingDays: number[];
  location: {
    type: string;
    coordinates: [number, number];
  };
  status: "pending" | "approved" | "suspended";
  rating: number;
  ratingCount: number;
};

type CreateProviderRequest = {
  user: string;
  offeredServices: string[];
  experience: number;
  workHourStart: number;
  workHourEnd: number;
  workingDays: number[];
  location: {
    type: "Point";
    coordinates: [number, number];
  };
};

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProviders() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${BASE_URL}/providers`);

        if (!response.ok) {
          throw new Error(`Failed to load providers: ${response.status}`);
        }

        const data: Provider[] = await response.json();
        setProviders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Request failed");
      } finally {
        setLoading(false);
      }
    }

    void loadProviders();
  }, []);

  async function createProvider(
    requestBody: CreateProviderRequest,
  ): Promise<void> {
    const response = await fetch(`${BASE_URL}/providers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Failed to create provider: ${response.status}`);
    }

    const createdProvider: Provider = await response.json();

    setProviders((currentProviders) => [
      ...currentProviders,
      createdProvider,
    ]);
  }

  async function updateProvider(
    providerId: string,
    changes: Partial<CreateProviderRequest> & {
      status?: Provider["status"];
    },
  ): Promise<void> {
    const response = await fetch(`${BASE_URL}/providers/${providerId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(changes),
    });

    if (!response.ok) {
      throw new Error(`Failed to update provider: ${response.status}`);
    }

    const updatedProvider: Provider = await response.json();

    setProviders((currentProviders) =>
      currentProviders.map((provider) =>
        provider._id === providerId ? updatedProvider : provider,
      ),
    );
  }

  async function deleteProvider(providerId: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/providers/${providerId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete provider: ${response.status}`);
    }

    setProviders((currentProviders) =>
      currentProviders.filter((provider) => provider._id !== providerId),
    );
  }

  if (loading) {
    return <p>Loading providers...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <section>
      <h1>Service providers</h1>

      {providers.length === 0 ? (
        <p>No providers found.</p>
      ) : (
        <ul>
          {providers.map((provider) => (
            <li key={provider._id}>
              <strong>{provider.experience} years of experience</strong>
              <span> Status: {provider.status}</span>
              <span> Rating: {provider.rating}</span>

              <button
                type="button"
                onClick={() =>
                  void updateProvider(provider._id, {
                    status: "approved",
                  })
                }
              >
                Approve
              </button>

              <button
                type="button"
                onClick={() => void deleteProvider(provider._id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

## GET request lifecycle

1. The component mounts.
2. `useEffect()` sends `GET http://localhost:3000/providers`.
3. NestJS routes the request to `ProvidersController.findAll()`.
4. `ProvidersService.findAll()` queries MongoDB.
5. Mongoose populates the related user while excluding the password.
6. NestJS serializes the documents as JSON.
7. React receives the JSON array.
8. `setProviders()` updates local component state.
9. React renders the provider list.

## POST request lifecycle

1. A form or button creates a request object.
2. React serializes it as JSON.
3. NestJS validates it against `CreateProviderDto`.
4. `ProvidersService.create()` saves it through Mongoose.
5. MongoDB returns the created document.
6. React adds the new document to its local `providers` state.

## Authentication

The current provider controller does not require a bearer token. If authentication is enabled later, add the token to the request:

```ts
const response = await fetch(`${BASE_URL}/providers`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

For JSON mutations, include both headers:

```ts
headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
}
```

## CORS

The backend enables CORS in `main.ts`. If the backend uses a configured `CORS_ORIGIN`, include the frontend origin:

```env
CORS_ORIGIN=http://localhost:5173
```

The backend allows credentials, so an axios or fetch request may use credentials if the authentication design later requires cookies:

```ts
fetch(url, {
  credentials: "include",
});
```

Use credentials only when the backend actually uses cookie-based authentication.

## Fetch versus axios

Both approaches work. The browser's built-in `fetch` is enough for the example above. The project also already declares `axios`, so an equivalent GET request is:

```ts
import axios from "axios";
import { BASE_URL } from "../../services/api";

const response = await axios.get<Provider[]>(`${BASE_URL}/providers`);
setProviders(response.data);
```

Neither approach requires Redux.
