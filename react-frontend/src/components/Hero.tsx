interface HeroProps {
    onNavigate: (path: string) => void;
}

export default function Hero({ onNavigate }: HeroProps) {
    return (
        <div className="hero-services">
            <button className="btn-hero" onClick={() => onNavigate("/services")}>
                Explore
            </button>
        </div>

    )
}