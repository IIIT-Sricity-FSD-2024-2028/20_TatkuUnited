import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from "@/store";
import {
    createRegion,
    deleteRegion,
    fetchManagers,
    fetchRegions,
    superuserActions,
    updateRegion,
} from "@/store/superuser/superuser-slice";
import type {
    CreateRegionDto,
    ManagerDocument,
    RegionDocument,
    UpdateRegionDto,
} from '@/models/api.models';
import DataTable, { type Column } from '@/components/superuser/DataTable';
import SummaryCards, { type SummaryStat } from '@/components/superuser/SummaryCards';
import { BsGeoAltFill, BsGeoAlt, BsGlobe, BsPlus } from 'react-icons/bs';

/** Region.manager can be an id or a populated manager; the page needs the id. */
function managerIdOf(region: RegionDocument): string {
    return typeof region.manager === 'string' ? region.manager : region.manager._id;
}

/**
 * A manager profile can outlive its user record (for example, if the user was
 * deleted during testing). GET /managers populates `user`, so those profiles
 * come back with `user: null`; show a stable label instead of a blank option.
 */
function managerLabel(manager: ManagerDocument): string {
    const user = manager.user;
    if (typeof user === 'object' && user?.name) return user.name;
    return `Manager ${manager._id.slice(-6)} (no user)`;
}

export default function SuperUser_ManageRegions()
{
    const dispatch = useDispatch<AppDispatch>();
    const { regions, managers, pending, error } = useSelector(
        (state: RootState) => state.superuser,
    );

    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');

    const [isAdd, setIsAdd] = useState(false);
    const [isEditingID, setIsEditingID] = useState('');
    const editingRegion = isEditingID
        ? regions.find(r => r._id === isEditingID) ?? null
        : null;

    const userNameMap = useMemo(() => {
        const map: Record<string, string> = {};
        managers.forEach(m => {
            map[m._id] = managerLabel(m);
        });
        return map;
    }, [managers]);

    const activeRegions = regions.filter(reg => reg.isActive).length;

    const SUMMARY_STATS: SummaryStat[] = [
        { title: "Total Regions", count: regions.length, icon: <BsGlobe size={20} />, iconColor: "text-blue-600", bg: "bg-blue-50" },
        { title: "Active Regions", count: activeRegions, icon: <BsGeoAltFill size={20} />, iconColor: "text-green-600", bg: "bg-green-50" },
        { title: "Inactive Regions", count: regions.length - activeRegions, icon: <BsGeoAlt size={20} />, iconColor: "text-red-600", bg: "bg-red-50" },
    ];

    const filteredRegions = regions.filter(reg => {
        if(!reg.name.toLowerCase().includes(search.toLowerCase())) return false;
        if(status !== 'all' && status==='active' && !reg.isActive) return false;
        if(status !== 'all' && status==='inactive' && reg.isActive) return false;
        return true;
    });

    const columns: Column<RegionDocument>[] = [
        {header: 'Name', render: (row) => <span className="font-medium text-slate-900">{row.name}</span>},
        {header: 'Manager', render: (row) => {
            const mgrId = managerIdOf(row);
            return <span className="text-slate-500">{mgrId ? userNameMap[mgrId] ?? '—' : '—'}</span>;
        }},
        {header: 'Status', render: (row) => <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>},
        {header: 'Actions', render: (row) => (
            <button 
                type="button" 
                className="text-blue-600 hover:underline font-medium"
                onClick={() => {
                    dispatch(superuserActions.clearError());
                    setIsEditingID(row._id);
                }}
            >
                Edit
            </button>
        )
        },
    ]

    useEffect(() => {
        dispatch(fetchRegions());
        dispatch(fetchManagers());
    }, [dispatch]);

    const closeAdd = () => {
        setIsAdd(false);
        dispatch(superuserActions.clearError());
    };

    const closeEdit = () => {
        setIsEditingID('');
        dispatch(superuserActions.clearError());
    };

    return(
        <div className="flex flex-col gap-6">
            
            <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-1">Region Management</h1>
                  <p className="text-slate-500 text-sm">Define and manage geographical regions and their assigned managers.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    dispatch(superuserActions.clearError());
                    setIsAdd(true);
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  <BsPlus size={20} />
                  Add New Region
                </button>
            </div>

            {isAdd && (
                <AddRegion 
                    onClose={closeAdd} 
                    allManagers={managers}
                    assignedRegions={regions}
                    userNameMap={userNameMap}
                />
            )}

            {editingRegion && (
            <EditRegion
                onClose={closeEdit}
                allManagers={managers}
                userNameMap={userNameMap}
                region={editingRegion}
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
            isLoading={pending > 0}
            error={isAdd || editingRegion ? null : error}
            emptyMessage='No Regions found matching your search.'
        />

        </div>
    )
}

interface AddRegionProps
{
    onClose: () => void;
    allManagers: ManagerDocument[];
    assignedRegions: RegionDocument[];
    userNameMap: Record<string, string>;
}

interface EditRegionProps {
    onClose: () => void;
    allManagers: ManagerDocument[];
    userNameMap: Record<string, string>;
    region: RegionDocument;
    assignedRegions: RegionDocument[];
}

function AddRegion({ onClose, allManagers, assignedRegions, userNameMap }: AddRegionProps) {
    const dispatch = useDispatch<AppDispatch>();
    const { submitting, error: storeError } = useSelector(
        (state: RootState) => state.superuser,
    );

    const [name, setName] = useState('');
    const [manager, setManager] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [coord1, setCoord1] = useState('');
    const [coord2, setCoord2] = useState('');
    const [salary, setSalary] = useState('');
    const [formError, setFormError] = useState('');
    const error = formError || storeError;

    const assignedManagerIds = new Set(assignedRegions.map(managerIdOf));
    const unassignedManagers = allManagers.filter(m => !assignedManagerIds.has(m._id));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        if (!manager) { setFormError('Please select a manager.'); return; }
        if (!coord1 || !coord2) { setFormError('Please enter both coordinates.'); return; }

        const dto: CreateRegionDto = {
            name,
            manager,
            location: {
                type: 'Point',
                coordinates: [parseFloat(coord1), parseFloat(coord2)],
            },
            isActive,
        };

        try {
            await dispatch(createRegion({ dto, salary: parseInt(salary) })).unwrap();
            onClose();
        } catch {
            // the rejected thunk stores a readable message in the slice
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
                        disabled={submitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
                    >
                        {submitting ? 'Creating...' : 'Create Region'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function EditRegion({ onClose, allManagers, assignedRegions, userNameMap, region }: EditRegionProps) {
    const dispatch = useDispatch<AppDispatch>();
    const { submitting, error: storeError } = useSelector(
        (state: RootState) => state.superuser,
    );

    const [name, setName] = useState(region.name);
    const [isActive, setIsActive] = useState(region.isActive);
    const [coord1, setCoord1] = useState(String(region.location.coordinates[0]));
    const [coord2, setCoord2] = useState(String(region.location.coordinates[1]));

    const currentManagerId = managerIdOf(region);
    const [managerId, setManagerId] = useState(currentManagerId);
    const [salary, setSalary] = useState(
        String(allManagers.find(m => m._id === currentManagerId)?.salary ?? ''),
    );

    const [formError, setFormError] = useState('');
    const error = formError || storeError;


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        if (!managerId) { setFormError('Please select a manager.'); return; }
        if (!coord1 || !coord2) { setFormError('Please enter both coordinates.'); return; }

        const dto: UpdateRegionDto = {
            name,
            manager: managerId,
            location: {
                type: 'Point',
                coordinates: [parseFloat(coord1), parseFloat(coord2)],
            },
            isActive,
        };

        try {
            await dispatch(updateRegion({
                id: region._id,
                dto,
                managerId,
                salary: parseInt(salary),
            })).unwrap();
            onClose();
        } catch {
            // the rejected thunk stores a readable message in the slice
        }
    };

    const assignedManagerIds = new Set(
        assignedRegions
            .filter(r => managerIdOf(r) !== currentManagerId)
            .map(managerIdOf),
    );
    const availableManagers = allManagers.filter(m => !assignedManagerIds.has(m._id));

    const handleDelete = async () => {
        try {
            await dispatch(deleteRegion(region._id)).unwrap();
            onClose();
        } catch {
            // the rejected thunk stores a readable message in the slice
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
                            disabled={submitting}
                            className="px-4 py-2 bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
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
                                disabled={submitting}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
                            >
                                {submitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}