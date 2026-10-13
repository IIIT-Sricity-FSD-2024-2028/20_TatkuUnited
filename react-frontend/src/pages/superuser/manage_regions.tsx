import { useContext, useEffect, useState } from 'react';
import AuthContext from '../../common/AuthContext';
import { getAllRegions, createRegion, updateRegion, deleteRegion} from '@/services';
import { type RegionDocument } from '@/models/api.models';
import DataTable, { type Column } from '@/components/superuser/DataTable';



export default function SuperUser_ManageRegions()
{
    const authContext = useContext(AuthContext);
    const token = authContext?.authDetails?.token;
    const user = authContext?.authDetails?.user;
    const super_user_id = user?.id;

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('false');

    const [regions, setRegions] = useState<RegionDocument[]>([]);

    const filteredRegions = regions;

    const columns: Column<RegionDocument>[] = []

    useEffect(() => {
        setIsLoading(true);
        const fetchRegions = async () => {
            try
            {
                const response = await getAllRegions();
                setRegions(response);
                console.log(response);
                setIsLoading(false);
            }
            catch(err)
            {
                
                console.error(error);
            }

            setIsLoading(false);
            setError('');
        }

        fetchRegions(); 
    },[])

    


    return(
        <div>
            <DataTable
                columns={columns}
                data={filteredRegions}
                rowKey={(row) => row._id}
                isLoading={isLoading}
                error={error}
                emptyMessage='No Regions found'
            />
        </div>
    )
}