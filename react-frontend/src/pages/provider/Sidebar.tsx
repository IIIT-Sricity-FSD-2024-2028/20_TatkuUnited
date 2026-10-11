type SidebarProps = {
    onPageChange: (page: string) => void;
};

export default function Sidebar({
    onPageChange,
}: SidebarProps) {

    return (
        <aside className="w-64 border-4 border-black flex flex-col">

        <button
            className="h-30 border-b-4 border-green-500"
            onClick={() => onPageChange("Dashboard")}
        >
            Dashboard
        </button>

        <button
            className="h-26 border-b-4 border-green-500"
            onClick={() => onPageChange("Users")}
        >
            Users
        </button>

        <button
            className="h-26 border-b-4 border-green-500"
            onClick={() => onPageChange("Reports")}
        >
            Reports
        </button>

        <button
            className="h-26 border-b-4 border-green-500"
            onClick={() => onPageChange("Settings")}
        >
            Settings
        </button>

        <button
            className="h-26 border-b-4 border-green-500"
            onClick={() => onPageChange("Profile")}
        >
            Profile
        </button>

        </aside>
    );
}