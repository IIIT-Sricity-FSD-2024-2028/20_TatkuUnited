import { Link } from "react-router-dom";

interface PublicNavbarProps {
    brandName: string;
    brandInitials: string;
    onNavigate: (path: string) => void;
}

export default function PublicNavbar({ brandName, brandInitials, onNavigate }: PublicNavbarProps) {
    return (
        <nav id="navbar" className="flex items-center justify-between px-6 py-4 bg-white shadow-sm fixed top-0 left-0 w-full z-50">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-gray-800 no-underline">
                <div className="nav-logo-icon">{brandInitials}</div>
                {brandName}
            </Link>

            <div className="flex items-center gap-3">
                <button className="px-4 py-2 text-sm font-medium border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => onNavigate("/auth/login")}>
                    Login
                </button>
                <button className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer" onClick={() => onNavigate("/auth/register")}>
                    Register
                </button>
            </div>
        </nav>
    )
}