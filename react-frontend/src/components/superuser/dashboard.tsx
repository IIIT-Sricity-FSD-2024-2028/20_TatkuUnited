export default function SuperUser_Dashboard()
{
    const provider_split = 85;
    const platform_split = 15;
    return(
        <div>
            <h1>
                Platform Revenue Analysis
            </h1>
            <p>Comprehensive breakdown of collective revenue distribution.</p>

            <div>
                <h2>Revenue Split</h2>
                Provider: {provider_split}
                Platform: {platform_split}
            </div>
        </div>
    )
}