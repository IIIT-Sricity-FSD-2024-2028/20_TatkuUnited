interface CTAProps {
    onNavigate: (path: string) => void;
}

export default function CTA({ onNavigate }: CTAProps) {
    return (
        <div className="px-6 py-16 flex justify-center">
            <div className="bg-blue-600 rounded-3xl p-10 md:p-16 w-full max-w-5xl text-center shadow-lg">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Book Your First Service Today
                </h2>
                <p className="text-blue-100 mb:8 text-lg">
                    Join thousands of happy customers who trust Tatku United for reliable, affordable home services.
                </p>
                <button className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg cursor-pointer transition-colors" onClick={() => onNavigate("/auth/register")}>
                    Get Started →
                </button>
            </div>
        </div>
    )
}