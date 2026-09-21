import AssignedJobs from "./Sp_dashboard_body";

type BodyProps = {
    activePage: string;
};

export default function Body({activePage}: BodyProps) {
    let content;

    switch (activePage) {
        case "Dashboard":
            content = (<h1>Render Dashboard Body content here</h1>);
            break;
        case "Users":
            content = (<h1>Render Users Body content here</h1>);
            break;
        case "Reports":
            content = (<h1>Render Reports Body content here</h1>);
            break;
        case "Settings":
            content = (<h1>Render Settings Body content here</h1>);
            break;
        case "Profile":
            content = (<h1>Render Profile Body content here</h1>);
        break;
        
        default:
            content = (<h1>Page not found</h1>);

    }

    return (
    <main className="flex-1 border-2 border-yellow-400 p-8">
        <div>
            <AssignedJobs spId="89b3386b-aea4-4602-a2f8-1199b5c14303" />
        </div>
        {content}
    </main>
    );

}