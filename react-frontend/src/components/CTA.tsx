interface CTAProps {
    onNavigate: (path: string) => void;
}

export default function CTA({ onNavigate }: CTAProps) {
    return (
        <button className="btn-cta" onClick={() => onNavigate("/auth/register")}>
            Get Started →
        </button>
    )
}