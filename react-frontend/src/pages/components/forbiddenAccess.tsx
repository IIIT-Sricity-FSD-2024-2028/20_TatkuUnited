export default function ForbiddenAccess() {
  return (
    <div className="h-dvh w-full flex justify-center items-center">
      <div>
        <h2 className="text-2xl text-red-500">403 - Forbidden Access</h2>
        <p>You are not authorized to visit this page</p>
      </div>
    </div>
  );
}
