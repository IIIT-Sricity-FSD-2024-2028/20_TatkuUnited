interface HeroProps {
    onNavigate: (path: string) => void;
}

export default function Hero({ onNavigate }: HeroProps) {
    return (
        <div className="min-h-[70vh] bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-6">
            <div className="max-w-3xl">
                <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-right tracking-tight mb-6">
                    Reliable Home Serivices,<br />
                    <span className="text-blue-600">Delivered On Time</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl">
                    Book trusted professionals for repairs, cleaning, and
                    maintenance in just a few clicks. Quality service,
                    guaranteed.
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg cursor-pointer transition-colors text-lg" onClick={() => onNavigate("/services")}>
                    Explore
                </button>
            </div>
        </div>

    )
}