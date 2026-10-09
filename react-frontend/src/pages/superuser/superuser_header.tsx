export default function SuperUser_Header() {
  return (
    <>
      <header className="h-24 border-4 border-blue-500 flex items-center justify-between px-6">
        <div className="w-56 h-14 text-blue-500 flex items-center justify-center text-3xl">
          Tatku United
        </div>

        <div className="w-115 flex items-center justify-center">
          This page is a dynamic React template for the Super User, which
          renders different content on sidebar clicks
        </div>

        <div className="w-16 h-16 rounded-full border-4 border-black flex items-center justify-center text-sm">
          Profile
        </div>
      </header>
    </>
  );
}
