import { useContext, useEffect, useState } from 'react';
import AuthContext from '../../common/AuthContext';
import { getAllRegions, createRegion, updateRegion, deleteRegion, getAllManagers, updateManager } from '@/services';
import { type RegionDocument, type ManagerDocument, type CreateRegionDto } from '@/models/api.models';
import DataTable, { type Column } from '@/components/superuser/DataTable';
import { type UserDocument } from '@/models/api.models';
import { type UpdateRegionDto } from '@/models/api.models';
import SummaryCards, { type SummaryStat } from '@/components/superuser/SummaryCards';
import { BsGeoAltFill, BsGeoAlt, BsGlobe, BsPlus } from 'react-icons/bs';

export default function SuperUser_ManageRegions()
{
    const authContext = useContext(AuthContext);
    const token = authContext?.authDetails?.token;

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [regions, setRegions] = useState<RegionDocument[]>([]);
    const [userNameMap, setUserNameMap] = useState<Record<string, string>>({});
    const [allManagers, setAllManagers] = useState<ManagerDocument[]>([]);

    const activeRegions = regions.filter(reg => reg.isActive).length;

    const SUMMARY_STATS: SummaryStat[] = [
        { title: "Total Regions", count: regions.length, icon: <BsGlobe size={20} />, iconColor: "text-blue-600", bg: "bg-blue-50" },
        { title: "Active Regions", count: activeRegions, icon: <BsGeoAltFill size={20} />, iconColor: "text-green-600", bg: "bg-green-50" },
        { title: "Inactive Regions", count: regions.length - activeRegions, icon: <BsGeoAlt size={20} />, iconColor: "text-red-600", bg: "bg-red-50" },
    ];

    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');

    const [isAdd, setIsAdd] = useState(false);
    const [isEditingID, setIsEditingID] = useState('');

    const filteredRegions = regions.filter(reg => {
        if(!reg.name.toLowerCase().includes(search.toLowerCase())) return false;
        if(status !== 'all' && status==='active' && !reg.isActive) return false;
        if(status !== 'all' && status==='inactive' && reg.isActive) return false;
        return true;
    });

    const columns: Column<RegionDocument>[] = [
        {header: 'Name', render: (row) => <span className="font-medium text-slate-900">{row.name}</span>},
        {header: 'Manager', render: (row) => <span className="text-slate-500">{userNameMap[row.manager._id]}</span>},
        {header: 'Status', render: (row) => <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>},
        {header: 'Actions', render: (row) => (
            <button 
                type="button" 
                className="text-blue-600 hover:underline font-medium"
                onClick={() => setIsEditingID(row._id)}
            >
                Edit
            </button>
        )
        },
    ]

    const fetchRegions = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const [regionsResponse, managersResponse] = await Promise.all([
                getAllRegions(),
                getAllManagers(),
            ]);
            setRegions(regionsResponse);
            setAllManagers(managersResponse);

            const map: Record<string, string> = {};
            managersResponse.forEach(m => {
               const user = m.user as UserDocument | null;
                if (user) {
                    map[m._id] = user.name;
                }
                
            });
            setUserNameMap(map);
            console.log(managersResponse);
        } 
        catch (err) 
        {
            console.error(err);
            setError('Failed to fetch regions.');
        } 
        finally 
        {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        fetchRegions(); 
    },[])

    return(
        <div className="flex flex-col gap-6">
            
            <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-1">Region Management</h1>
                  <p className="text-slate-500 text-sm">Define and manage geographical regions and their assigned managers.</p>
                </div>
                <button
                  type="button"
                  onClick={() => { fetchRegions(); setIsAdd(true); }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  <BsPlus size={20} />
                  Add New Region
                </button>
            </div>

            {isAdd && (
                <AddRegion 
                    token={token}
                    onClose={() => setIsAdd(false)} 
                    refreshRegions={fetchRegions} 
                    allManagers={allManagers}
                    assignedRegions={regions}
                    userNameMap={userNameMap}
                />
            )}

            {isEditingID && (
            <EditRegion
                token={token}
                onClose={() => setIsEditingID('')}
                refreshRegions={fetchRegions}
                allManagers={allManagers}
                userNameMap={userNameMap}
                region={regions.find(r => r._id === isEditingID)!}
                assignedRegions={regions}
            />
        )}

        <SummaryCards stats={SUMMARY_STATS} />

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1 flex-1 min-w-50">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search Regions</label>
            <input
              type="text"
              placeholder="Search by name..."
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col gap-1 flex-2 min-w-37.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Region Status</label>
            <select
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
            
        <DataTable
            columns={columns}
            data={filteredRegions}
            rowKey={(row) => row._id}
            isLoading={isLoading}
            error={error}
            emptyMessage='No Regions found matching your search.'
        />

        </div>
    )
}

interface AddRegionProps
{
    onClose: () => void;
    token: string | null | undefined;
    refreshRegions: () => void;
    allManagers: ManagerDocument[];
    assignedRegions: RegionDocument[];
    userNameMap: Record<string, string>;
}

interface EditRegionProps {
    onClose: () => void;
    token: string | null | undefined;
    refreshRegions: () => void;
    allManagers: ManagerDocument[];
    userNameMap: Record<string, string>;
    region: RegionDocument;
    assignedRegions: RegionDocument[];
}

function AddRegion({ token, onClose, refreshRegions, allManagers, assignedRegions, userNameMap }: AddRegionProps) {
    const [name, setName] = useState('');
    const [manager, setManager] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [coord1, setCoord1] = useState('');
    const [coord2, setCoord2] = useState('');
    const [salary, setSalary] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const assignedManagerIds = new Set(
        assignedRegions.map(r =>
            (r.manager as ManagerDocument)._id
        )
    );
    const unassignedManagers = allManagers.filter(m => !assignedManagerIds.has(m._id));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!token) return;
        if (!manager) { setError('Please select a manager.'); return; }
        if (!coord1 || !coord2) { setError('Please enter both coordinates.'); return; }

        const newRegion: CreateRegionDto = {
            name,
            manager,
            location: {
                type: 'Point',
                coordinates: [parseFloat(coord1), parseFloat(coord2)],
            },
            isActive,
        };

        await updateManager(manager, { salary: parseInt(salary) });

        setIsSubmitting(true);
        setError('');
        try {
            await createRegion(newRegion);
            refreshRegions();
            onClose();
        } catch (err) {
            console.error(err);
            setError('Failed to create region. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Create New Region</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Region Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            placeholder="e.g. North Zone"
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Manager</label>
                        <select 
                            value={manager} 
                            onChange={e => setManager(e.target.value)} 
                            required
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                        >
                            <option value="">Select a Manager</option>
                            {unassignedManagers.map(m => (
                                <option key={m._id} value={m._id}>
                                    {userNameMap[m._id]}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Manager Salary (₹ in paise)</label>
                        <input
                            type="number"
                            value={salary}
                            onChange={e => setSalary(e.target.value)}
                            required
                            min={0}
                            placeholder="e.g. 3000000 for ₹30,000"
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Longitude (coord[0])</label>
                        <input
                            type="text"
                            value={coord1}
                            onChange={e => setCoord1(e.target.value)}
                            required
                            placeholder="e.g. 77.5946"
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Latitude (coord[1])</label>
                        <input
                            type="text"
                            value={coord2}
                            onChange={e => setCoord2(e.target.value)}
                            required
                            placeholder="e.g. 12.9716"
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1 mt-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Region Status</label>
                    <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={isActive}
                                onChange={e => setIsActive(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                        <span className={`text-sm font-semibold ${isActive ? 'text-green-700' : 'text-slate-500'}`}>
                            {isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                <div className="flex justify-end items-center gap-3 mt-2 border-t border-slate-100 pt-4">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                        {isSubmitting ? 'Creating...' : 'Create Region'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function EditRegion({ token, onClose, refreshRegions, allManagers, assignedRegions, userNameMap, region }: EditRegionProps) {
    const [name, setName] = useState(region.name);
    const [isActive, setIsActive] = useState(region.isActive);
    const [coord1, setCoord1] = useState(String(region.location.coordinates[0]));
    const [coord2, setCoord2] = useState(String(region.location.coordinates[1]));

    const currentManager = region.manager as ManagerDocument;
    const [managerId, setManagerId] = useState(currentManager._id);

    const [salary, setSalary] = useState(String(currentManager.salary));

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        if (!managerId) { setError('Please select a manager.'); return; }
        if (!coord1 || !coord2) { setError('Please enter both coordinates.'); return; }

        const updatedRegion: UpdateRegionDto = {
            name,
            manager: managerId,
            location: {
                type: 'Point',
                coordinates: [parseFloat(coord1), parseFloat(coord2)],
            },
            isActive,
        };

        setIsSubmitting(true);
        setError('');
        try {
            await updateRegion(region._id, updatedRegion);

            await updateManager(managerId, { salary: parseInt(salary) });

            refreshRegions();
            onClose();
        } catch (err) {
            console.error(err);
            setError('Failed to update region. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const assignedManagerIds = new Set(
        assignedRegions
            .filter(r => (r.manager as ManagerDocument)._id !== currentManager._id)
            .map(r => (r.manager as ManagerDocument)._id)
    );
    const availableManagers = allManagers.filter(m => !assignedManagerIds.has(m._id));

    const handleDelete = async () => {
        if (!token) return;
        setIsSubmitting(true);
        setError('');
        try {
            await deleteRegion(region._id);
            refreshRegions();
            onClose();
        } catch (err) {
            console.error(err);
            setError('Failed to delete region. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg border border-slate-200 overflow-y-auto max-h-[90vh]">
                <h2 className="text-lg font-bold text-slate-900 mb-1">Edit Region</h2>
                <p className="text-sm text-slate-500 mb-6">
                    Modify details for region ID: <span className="font-mono text-slate-700 text-xs">{region._id}</span>
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1 md:col-span-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Region Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Manager</label>
                            <select 
                                value={managerId} 
                                onChange={e => setManagerId(e.target.value)} 
                                required
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                            >
                                <option value="">Select a Manager</option>
                                {availableManagers.map(m => (
                                    <option key={m._id} value={m._id}>
                                        {userNameMap[m._id]}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Manager Salary (₹ in paise)</label>
                            <input
                                type="number"
                                value={salary}
                                onChange={e => setSalary(e.target.value)}
                                required
                                min={0}
                                placeholder="e.g. 3000000 for ₹30,000"
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Longitude (coord[0])</label>
                            <input
                                type="text"
                                value={coord1}
                                onChange={e => setCoord1(e.target.value)}
                                required
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Latitude (coord[1])</label>
                            <input
                                type="text"
                                value={coord2}
                                onChange={e => setCoord2(e.target.value)}
                                required
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 mt-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Region Status</label>
                        <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={isActive}
                                    onChange={e => setIsActive(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                            <span className={`text-sm font-semibold ${isActive ? 'text-green-700' : 'text-slate-500'}`}>
                                {isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                    <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-4">
                        <button 
                            type="button" 
                            onClick={handleDelete} 
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                        >
                            Delete
                        </button>
                        
                        <div className="flex gap-3">
                            <button 
                                type="button" 
                                onClick={onClose}
                                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                            >
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}