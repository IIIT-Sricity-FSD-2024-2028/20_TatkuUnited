export default function UserHeader({ header }) {
  return (
    <div className="flex items-center p-4">
      <h2 className="text-xl font-semibold">{header}</h2>
    </div>
  );
}
