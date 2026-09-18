import { useNavigate } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar";
import Hero from "../components/Hero";
import CTA from "../components/CTA";



function LandingPage() {
    const navigate = useNavigate();

    const brandName = "Tatku United";
    const brandInitials = "TU";

    const handleNavigate = (path: string) => {
        navigate(path);
    };

    return (
        <>
            <PublicNavbar
                brandName={brandName}
                brandInitials={brandInitials}
                onNavigate={handleNavigate}
            />
            <Hero onNavigate={handleNavigate} />
            <CTA onNavigate={handleNavigate} />
        </>
    )
}

export default LandingPage;