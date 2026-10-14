import { Button } from "@/components/ui/button";

type SidebarProps = {
    onPageChange: (page: string) => void;
    activePage: string;
};

export default function Sidebar({
    onPageChange,
    activePage,
}: SidebarProps) {
    const pages = [
        { label: "Dashboard", page: "Dashboard" },
        { label: "Assigned Jobs", page: "Assigned Jobs" },
        { label: "Calendar", page: "Calendar" },
        { label: "Earnings", page: "Earnings" },
        { label: "Settings", page: "Settings" },
    ];

    return (
        <aside className="w-64 border-r bg-background p-3">
            <nav aria-label="Provider navigation" className="space-y-1">
                {pages.map(({ label, page }) => (
                    <Button
                        className="w-full justify-start"
                        key={page}
                        onClick={() => onPageChange(page)}
                        variant={activePage === page ? "secondary" : "ghost"}
                    >
                        {label}
                    </Button>
                ))}
            </nav>
        </aside>
    );
}