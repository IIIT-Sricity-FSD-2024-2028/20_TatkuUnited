import { useNavigate } from "react-router-dom";
import PublicNavbar from "../PublicNavbar";
import Hero from "../Hero";
import CTA from "../CTA";

function LandingPage() {
  const navigate = useNavigate();

  const brandName = "Tatku United";
  const brandInitials = "TU";

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="pt-17">
      <PublicNavbar
        brandName={brandName}
        brandInitials={brandInitials}
        onNavigate={handleNavigate}
      />
      <Hero onNavigate={handleNavigate} />
      <CTA onNavigate={handleNavigate} />
    </div>
  );
}

export default LandingPage;
