
import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Link
                        to="/"
                        className="text-lg font-bold text-slate-900"
                    >
                        Tatku United
                    </Link>

                    <p className="mt-1 text-sm text-slate-500">
                        Reliable services, made simple.
                    </p>
                </div>

                <nav
                    aria-label="Footer navigation"
                    className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500"
                >
                    <Link
                        to="/"
                        className="transition-colors hover:text-blue-600"
                    >
                        Home
                    </Link>

                    <Link
                        to="/cart"
                        className="transition-colors hover:text-blue-600"
                    >
                        Cart
                    </Link>

                    <Link
                        to="/account-settings"
                        className="transition-colors hover:text-blue-600"
                    >
                        Account Settings
                    </Link>

                    <Link
                        to="/ratings-feedback"
                        className="transition-colors hover:text-blue-600"
                    >
                        Ratings & Feedback
                    </Link>
                </nav>
            </div>

            <div className="border-t border-slate-100 px-6 py-4 text-center text-xs text-slate-500">
                © {new Date().getFullYear()} Tatku United. All rights reserved.
            </div>
        </footer>
    );
}
