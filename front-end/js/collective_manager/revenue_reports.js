document.addEventListener("DOMContentLoaded", async function () {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("No auth token found. Please login first.");
      return;
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    const role = payload.role;

    const allowedRoles = ["super_user", "collective_manager", "unit_manager"];

    if (!allowedRoles.includes(role)) {
      console.error("Invalid role. Please login as collective_manager / unit_manager / super_user");
      return;
    }

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };

    const unitsRes = await fetch("http://localhost:10000/units", { headers });

    if (unitsRes.status === 403) {
      console.error("Forbidden: Backend rejected role");
      return;
    }

    const unitsData = await unitsRes.json();
    console.log("UNITS DATA:", unitsData);

    const providersRes = await fetch("http://localhost:10000/service-providers", { headers });

    if (providersRes.status === 403) {
      console.error("Forbidden: Backend rejected role");
      return;
    }

    const providersData = await providersRes.json();
    console.log("PROVIDERS DATA:", providersData);

  } catch (error) {
    console.error("Error:", error);
  }
});
