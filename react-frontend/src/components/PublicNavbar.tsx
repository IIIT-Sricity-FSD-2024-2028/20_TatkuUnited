import { Link } from "react-router-dom";

interface PublicNavbarProps {
    brandName: string;
    brandInitials: string;
    onNavigate: (path: string) => void;
}

export default function PublicNavbar({ brandName, brandInitials, onNavigate }: PublicNavbarProps) {
    return (
        <nav id="navbar">
            <Link to="/" className="nav-logo">
                <div className="nav-logo-icon">{brandInitials}</div>
                {brandName}
            </Link>

            <div className="nav-auth">
                <button className="btn-primary" onClick={() => onNavigate("/auth/login")}>
                    Login
                </button>
                <button className="btn-primary" onClick={() => onNavigate("/auth/register")}>
                    Register
                </button>
            </div>
        </nav>
    )
}