import AuthContext from "@/common/AuthContext";
import type { PlatformSettingDocument, UpdatePlatformSettingDto } from "@/models/api.models";
import { getAllPlatformSettings, updatePlatformSetting } from "@/services";
import React, { useContext, useEffect, useState } from "react";

export default function SuperUser_PlatformSettings()
{
    const authContext = useContext(AuthContext);
    const token = authContext?.authDetails?.token;
    
    const [platformSettings, setPlatformSettings] = useState<PlatformSettingDocument>();
    
    const [platformFee, setPlatformFee] = useState<number | undefined>();

    const [maxAssDist, setMaxAssDist] = useState<number | undefined>();

    const [slotInterval, setSlotInterval] = useState<number | undefined>();
    const [firstSlotStart, setfirstSlotStart] = useState<number | undefined>();
    const [lastSlotStart, setLastSlotStart] = useState<number | undefined>();
    const [bookWindow, setBookWindow] = useState<number | undefined>();
    const [minLead, setMinLead] = useState<number | undefined>();
    const [travelBuffer, setTravelBuffer] = useState<number | undefined>();
    const [offerTimeout, setOfferTimeout] = useState<number | undefined>();

    const safeInterval = slotInterval !== undefined && slotInterval >= 15 ? (slotInterval <= 120 ? slotInterval : 120) : 15;

    const startSlots = Array.from(
        { length: Math.ceil((18 * 60) / safeInterval) }, //cause the start is 6
        (_, i) => 6 * 60 + i * safeInterval
    );

    const lastSlots = Array.from(
        { length: Math.ceil((24 * 60 - (firstSlotStart || 0)) / safeInterval) },
        (_, i) => (firstSlotStart || 0) + i * safeInterval
    );

    const fetchPlatSet = async () => {
        try
        {
            const response = await getAllPlatformSettings();
            
            setPlatformSettings(response?.[0]);
        }
        catch(err)
        {
            console.error('boo', err);
        }
    }

    useEffect(() => {
        fetchPlatSet();
    }, [token])

    useEffect(()=>{
        setSlotInterval(platformSettings?.slotIntervalMinutes);
        setMaxAssDist(platformSettings?.maxAssignmentDistanceKm);
        setPlatformFee(platformSettings?.platformFeePercent);
        setfirstSlotStart(platformSettings?.firstSlotStart);
        setLastSlotStart(platformSettings?.lastSlotStart);
        setBookWindow(platformSettings?.bookingWindowDays);
        setMinLead(platformSettings?.minLeadMinutes);
        setTravelBuffer(platformSettings?.travelBufferMinutes);
        setOfferTimeout(platformSettings?.offerTimeoutMinutes);
    }, [platformSettings])

    const handleSubmit = async (e: React.SyntheticEvent) =>
    {
        e.preventDefault();
        
        const settings: UpdatePlatformSettingDto = {
            platformFeePercent: platformFee,
            maxAssignmentDistanceKm: maxAssDist,
            slotIntervalMinutes: slotInterval,
            firstSlotStart: firstSlotStart,
            lastSlotStart: lastSlotStart,
            bookingWindowDays: bookWindow,
            minLeadMinutes: minLead,
            travelBufferMinutes: travelBuffer,
            offerTimeoutMinutes: offerTimeout,
        }

        try
        {
            if (!platformSettings?._id) return;
            const response = await updatePlatformSetting(platformSettings?._id, settings);
            console.log(response);
        }
        catch(err)
        {
            console.error('failed to update settings', err);
        }
    }

    return(
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Header Section */}
            <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-1">Platform Settings</h1>
                  <p className="text-slate-500 text-sm">Configure core platform metrics, financial rates, and scheduling parameters.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        type='button' 
                        onClick={() => fetchPlatSet()}
                        className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type='submit'
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Top Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Card 1: Financial Settings */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Financial Settings</h2>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Platform Fee (%)</label>
                        <input 
                            type='number'
                            value={platformFee ?? ''}
                            onChange={e => setPlatformFee(Number(e.target.value))}
                            placeholder="e.g. 15"
                            min={0}
                            max={100}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                        />
                    </div>
                </div>

                {/* Card 2: Assignment and Coverage */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Assignment & Coverage</h2>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Max Assignment Distance (km)</label>
                        <input 
                            type='number'
                            value={maxAssDist ?? ''}
                            onChange={e => setMaxAssDist(Number(e.target.value))}
                            placeholder="e.g. 10"
                            min={0}
                            max={25}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                        />
                    </div>
                </div>
            </div>

            {/* Card 3: Scheduling and Slot Settings (Full Width) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Scheduling & Slot Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Slot Interval (Mins)</label>
                        <input 
                            type='number'
                            value={slotInterval ?? ''}
                            onChange={e => {setSlotInterval(Number(e.target.value)); setfirstSlotStart(6 * 60); setLastSlotStart(undefined);}}
                            placeholder="e.g. 30"
                            min={15}
                            max={120}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">First Slot Start</label>
                        <select 
                            value={firstSlotStart ?? ''}
                            onChange={e => setfirstSlotStart(Number(e.target.value))}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                        >
                            {startSlots.map(slot => (
                                <option key={slot} value={slot}>
                                    {Math.floor(slot/60)}:{String(slot%60).padStart(2, '0')}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last Slot Start</label>
                        <select 
                            value={lastSlotStart ?? ''}
                            onChange={e => setLastSlotStart(Number(e.target.value))}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                        >
                            <option value="" disabled>Select time</option>
                            {lastSlots.map(slot => (
                                <option key={slot} value={slot}>
                                    {Math.floor(slot/60)}:{String(slot%60).padStart(2, '0')}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Booking Window (Days)</label>
                        <input 
                            type='number'
                            value={bookWindow ?? ''}
                            onChange={e => setBookWindow(Number(e.target.value))}
                            placeholder="e.g. 7"
                            min={0}
                            max={60}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Min Lead Time (Mins)</label>
                        <input 
                            type='number'
                            value={minLead ?? ''}
                            onChange={e => setMinLead(Number(e.target.value))}
                            placeholder="e.g. 120"
                            min={15}
                            max={1440}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Travel Buffer (Mins)</label>
                        <input 
                            type='number'
                            value={travelBuffer ?? ''}
                            onChange={e => setTravelBuffer(Number(e.target.value))}
                            placeholder="e.g. 30"
                            min={10}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Offer Timeout (Mins)</label>
                        <input 
                            type='number'
                            value={offerTimeout ?? ''}
                            onChange={e => setOfferTimeout(Number(e.target.value))}
                            placeholder="e.g. 10"
                            min={5}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                        />
                    </div>
                </div>
            </div>
            
        </form>
    )
}