import { useState } from "react";
import Header from "./Header.tsx";
import Sidebar from "./Sidebar.tsx";
import Footer from "./Footer.tsx";
import Body from "./Body.tsx";
import { useIncomingOfferNotifier } from "./useIncomingOfferNotifier";

export default function Layout() {
    const [activePage, setActivePage] = useState("Dashboard");

    // Background listener for incoming offers with interactive toast alerts
    useIncomingOfferNotifier();

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <div className="flex flex-1">
                <Sidebar onPageChange={setActivePage}/>
                <Body activePage={activePage}/>
            </div>
            <div><Footer/></div>
        </div>
    );
}