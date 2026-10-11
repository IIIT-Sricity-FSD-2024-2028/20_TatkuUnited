import axios from 'axios';
import { type RootState } from '../../store';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { BASE_URL } from '../../services/api';
import { type CategoriesResponse } from './manage_categories';
import {
  BsPlus,
  BsCart2,
  BsCheckCircle,
  BsExclamationCircle,
  BsStarFill,
} from 'react-icons/bs';
import SummaryCards, { type SummaryStat } from '../../components/superuser/SummaryCards';
import DataTable, { type Column } from '../../components/superuser/DataTable';


interface ServicesResponse {
  service_id: string;
  service_name: string;
  description: string;
  image_url?: string;
  base_price: number;
  estimated_duration_min: number;
  average_rating: number;
  rating_count: number;
  is_available: boolean;
  category_id: string;
  photos?: string[];
}



export default function SuperUser_ManageServices() {
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const super_user_id = user?.id;


  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all-categories');

  const [services, setServices] = useState<Array<ServicesResponse>>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalServices = services.length;
  const activeServices = services.filter(s => s.is_available).length;

  const [isAddService, setIsAddService] = useState(false);
  const [editingService, setEditingService] = useState<ServicesResponse | null>(null);

  // Hardcoded stats for UI - replace with dynamic counts
  const SUMMARY_STATS: SummaryStat[] = [
    { title: "Total Services", count: totalServices, icon: <BsCart2 size={24} />, iconColor: "text-blue-600", bg: "bg-blue-50" },
    { title: "Active Services", count: activeServices, icon: <BsCheckCircle size={24} />, iconColor: "text-green-600", bg: "bg-green-50" },
    { title: "Inactive Services", count: totalServices - activeServices, icon: <BsExclamationCircle size={24} />, iconColor: "text-orange-500", bg: "bg-orange-50" },
  ];

  const filteredServices = services.filter(svc => {

    const matchesSearch = svc.service_name.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = category === 'all-categories' || svc.category_id === category;

    return matchesSearch && matchesCategory;
  });


  const columns: Column<ServicesResponse>[] = [
    { header: "Service Name", render: (row) => <span className="font-medium text-slate-900">{row.service_name}</span> },
    { header: "Category", render: (row) => <>{categoryMap[row.category_id] || "Unknown Category"}</> },
    { header: "Description", render: (row) => <span className="text-slate-500">{row.description}</span>, cellClassName: "truncate max-w-[200px]" },
    {
      header: "Rating", render: (row) => (
        <div className="flex items-center gap-1.5 font-medium text-slate-700">
          <BsStarFill className={"text-amber-400"} />
          {row.average_rating}
        </div>
      )
    },
    {
      header: "Status", render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.is_available ? 'text-green-700' : 'text-red-700'}`}>
          {row.is_available ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      header: "Actions", render: (row) => (
        <button onClick={() => setEditingService(row)} className="text-blue-600 hover:underline font-medium">Edit</button>
      )
    },
  ];



  const fetchAllServices = async () => {
    if (!token || !super_user_id) return;

    try {
      setIsLoading(true);
      setError(null);

      const [servicesRes, categoriesRes] = await Promise.all([axios.get(`${BASE_URL}/services`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-role": "super_user,"
          },
        },
      ),
      axios.get(`${BASE_URL}/categories`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-role": "super_user,"
          },
        },
      ),
      ])

      setServices(servicesRes.data);

      const map: Record<string, string> = {};
      categoriesRes.data.forEach((cat: CategoriesResponse) => {
        map[cat.category_id] = cat.category_name;
      });

      setCategoryMap(map);

    }
    catch (err) {
      setError("Failed to fetch users. Please check your connection.");
      console.log(error);
    }
    finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAllServices();
  }, [token, super_user_id])


  return (
    <div className="flex flex-col gap-6">

      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Service Management</h1>
          <p className="text-slate-500 text-sm">Manage all services available on the platform with categories, pricing, and availability.</p>
        </div>
        <button onClick={() => setIsAddService(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
          <BsPlus size={20} />
          Add New Service
        </button>
      </div>

      {isAddService && (<AddService
        token={token}
        super_user_id={super_user_id}
        onClose={() => setIsAddService(false)}
        refreshServices={fetchAllServices}
        categoryMap={categoryMap}
      />)
      }
      {editingService && (
        <EditService
          token={token}
          super_user_id={super_user_id}
          onClose={() => setEditingService(null)}
          refreshServices={fetchAllServices}
          categoryMap={categoryMap}
          service={editingService}
        />
      )}

      {/* Summary Cards — uses reusable SummaryCards component */}
      <SummaryCards stats={SUMMARY_STATS} />

      {/* Standardized Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">

        <div className="flex flex-col gap-1 flex-[2] min-w-[200px]">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search Services</label>
          <input
            type="text"
            placeholder="Search by name..."
            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category Filter</label>
          <select
            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >

            <option value="all-categories">All Categories</option>

            {Object.entries(categoryMap).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <button
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors h-[38px]"
          onClick={() => {
            setSearch("");
            setCategory("all-categories");
          }}>
          Reset Filters
        </button>

      </div>

      {/* Data Table — uses reusable DataTable component */}
      <DataTable
        columns={columns}
        data={filteredServices}
        rowKey={(row) => row.service_id}
        isLoading={isLoading}
        error={error}
        emptyMessage="No services found matching your search."
      />

    </div>
  );
}




interface AddServiceProps {
  onClose: () => void;
  token: string | null;
  super_user_id: string | undefined;
  refreshServices: () => void;
  categoryMap: Record<string, string>;
}

interface EditServiceProps {
  onClose: () => void;
  token: string | null;
  super_user_id: string | undefined;
  refreshServices: () => void;
  categoryMap: Record<string, string>;
  service: ServicesResponse; // Pass the whole service object!
}


function AddService({ onClose, token, super_user_id, refreshServices, categoryMap }: AddServiceProps) {
  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [basePrice, setBasePrice] = useState<number | ''>('');
  const [duration, setDuration] = useState<number | ''>('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (!token || !super_user_id) return;

    if (!categoryId) {
      return;
    }

    const newService = {
      service_name: serviceName,
      description: description,
      image_url: imageUrl,
      photos: [photoUrl], // Wrap the string in an array!
      base_price: Number(basePrice),
      estimated_duration_min: Number(duration),
      is_available: isAvailable,
      category_id: categoryId
    };

    try {
      const response = await axios.post(`${BASE_URL}/services`, newService, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-role': "super_user",
        }
      });
      console.log("Successfully added service:", response.data);
      refreshServices();
      onClose();
    }
    catch (err) {
      console.error("Error adding service:", err);
    }

  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
      <h2 className="text-lg font-bold text-slate-900 mb-4">Create New Service</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Service Name</label>
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="e.g. Standard Home Clean"
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              required
            >
              <option value="" disabled>Select a Category...</option>
              {Object.entries(categoryMap).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Base Price (₹)</label>
            <input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(Number(e.target.value))}
              placeholder="e.g. 499"
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Est. Duration (Min)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              placeholder="e.g. 120"
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Main Image URL</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Additional Photo URL</label>
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              required
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the service..."
              rows={3}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50 md:col-span-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Service Availability</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              <span className="ml-3 text-sm font-bold text-slate-700">{isAvailable ? 'Active' : 'Inactive'}</span>
            </label>
          </div>

        </div>

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
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            Add Service
          </button>
        </div>
      </form>
    </div>
  )
}


function EditService({ onClose, token, super_user_id, refreshServices, categoryMap, service }: EditServiceProps) {

  // --- 1. BASE SERVICE STATE ---
  const [serviceName, setServiceName] = useState(service.service_name || '');
  const [description, setDescription] = useState(service.description || '');
  const [categoryId, setCategoryId] = useState(service.category_id || '');
  const [basePrice, setBasePrice] = useState<number | ''>(service.base_price || '');
  const [duration, setDuration] = useState<number | ''>(service.estimated_duration_min || '');
  const [isAvailable, setIsAvailable] = useState(service.is_available);
  const [imageUrl, setImageUrl] = useState(service.image_url || '');

  const [whatIsCovered, setWhatIsCovered] = useState('');
  const [whatIsNotCovered, setWhatIsNotCovered] = useState('');
  const [stepTitle, setStepTitle] = useState('');
  const [stepDesc, setStepDesc] = useState('');

  const [faqs, setFaqs] = useState<any[]>([]);
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');

  useEffect(() => {
    const fetchExtras = async () => {
      if (!token || !super_user_id) return;
      try {
        const contentRes = await axios.get(`${BASE_URL}/services/${service.service_id}/content`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (contentRes.data) {
          setWhatIsCovered(contentRes.data.what_is_covered?.join(', ') || '');
          setWhatIsNotCovered(contentRes.data.what_is_not_covered?.join(', ') || '');
          if (contentRes.data.how_it_works?.[0]) {
            setStepTitle(contentRes.data.how_it_works[0].step_title || '');
            setStepDesc(contentRes.data.how_it_works[0].step_description || '');
          }
        }

        const faqRes = await axios.get(`${BASE_URL}/services/${service.service_id}/faqs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFaqs(faqRes.data);
      } catch (err) {
        console.error("Error fetching extras:", err);
      }
    };
    fetchExtras();
  }, [service.service_id, token]);



  const handleUpdateBaseAndContent = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const updatedService = {
        service_name: serviceName,
        description: description,
        image_url: imageUrl,
        base_price: Number(basePrice),
        estimated_duration_min: Number(duration),
        is_available: isAvailable,
        category_id: categoryId,
      };
      await axios.patch(`${BASE_URL}/services/${service.service_id}`, updatedService, {
        headers: { Authorization: `Bearer ${token}`, 'x-role': "super_user" }
      });

      const updatedContent = {
        how_it_works: [{ step_title: stepTitle, step_description: stepDesc }],
        what_is_covered: whatIsCovered.split(',').map(s => s.trim()).filter(s => s !== ''),
        what_is_not_covered: whatIsNotCovered.split(',').map(s => s.trim()).filter(s => s !== '')
      };
      await axios.put(`${BASE_URL}/services/${service.service_id}/content`, updatedContent, {
        headers: { Authorization: `Bearer ${token}`, 'x-role': "super_user" }
      });

      refreshServices();
      onClose();
    } catch (err) {
      console.error("Error updating:", err);
    }
  };

  const handleAddFaq = async () => {
    if (!token || !newFaqQuestion || !newFaqAnswer) return;
    try {
      const response = await axios.post(`${BASE_URL}/services/${service.service_id}/faqs`, {
        question: newFaqQuestion,
        answer: newFaqAnswer,
        display_order: faqs.length + 1
      }, {
        headers: { Authorization: `Bearer ${token}`, 'x-role': "super_user" }
      });
      setFaqs([...faqs, response.data]);
      setNewFaqQuestion('');
      setNewFaqAnswer('');
      refreshServices();
    } catch (err) {
      console.error("Error adding FAQ:", err);
    }
  };

  const handleDelete = async () => 
  {
    if(!token && !super_user_id) return;

    try
    {
      const response = await axios.delete(`${BASE_URL}/services/${service.service_id}`,  
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-role": "super_user",
          },
        }
      );

      console.log(response.data);
      onClose();
      refreshServices();
    }
    catch(err)
    {
      console.error("Failed to delete the service", err);
    }
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      {/* Container has max-h to allow scrolling for this large form */}
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-3xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Edit Service</h2>
        <p className="text-sm text-slate-500 mb-6">
          Modifying details for: <span className="font-semibold text-slate-700">{service.service_name}</span>
        </p>

        <form onSubmit={handleUpdateBaseAndContent} className="flex flex-col gap-8">

          {/* --- SECTION 1: Basic Details --- */}
          <section>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">1. Basic Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service Name</label>
                <input type="text" value={serviceName} onChange={(e) => setServiceName(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500" required />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500" required>
                  <option value="" disabled>Select a Category...</option>
                  {Object.entries(categoryMap).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Base Price</label>
                <input type="number" value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value))} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500" required />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Est. Duration (Min)</label>
                <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500" required />
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Main Image URL</label>
                <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500" required />
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 resize-none" required />
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Service Availability</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  <span className="ml-3 text-sm font-bold text-slate-700">{isAvailable ? 'Active' : 'Inactive'}</span>
                </label>
              </div>
            </div>
          </section>

          {/* --- SECTION 2: Content Details --- */}
          <section>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">2. Content Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">What is Covered (Comma Separated)</label>
                <textarea value={whatIsCovered} onChange={(e) => setWhatIsCovered(e.target.value)} rows={3} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 resize-none" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">What is NOT Covered (Comma Separated)</label>
                <textarea value={whatIsNotCovered} onChange={(e) => setWhatIsNotCovered(e.target.value)} rows={3} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 resize-none" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">How it works - Step 1 Title</label>
                <input type="text" value={stepTitle} onChange={(e) => setStepTitle(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">How it works - Step 1 Desc</label>
                <input type="text" value={stepDesc} onChange={(e) => setStepDesc(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500" />
              </div>
            </div>
          </section>

          <div className="flex justify-end items-center gap-3">
            <button type="button" onClick={handleDelete} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 transition-colors">
              Delete
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 transition-colors">
              Close Form
            </button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
              Save Service Details
            </button>
          </div>
        </form>

        {/* --- SECTION 3: FAQs --- */}
        <section className="mt-8 border-t border-slate-200 pt-6">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">3. Frequently Asked Questions</h4>

          <div className="flex flex-col gap-3 mb-6">
            {faqs.length === 0 ? (
              <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">No FAQs added for this service yet.</p>
            ) : (
              faqs.map((faq, i) => (
                <div key={i} className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col gap-1">
                  <p className="text-sm font-bold text-slate-900">Q: {faq.question}</p>
                  <p className="text-sm text-slate-600">A: {faq.answer}</p>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-col gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Add New FAQ</h5>
            <input
              type="text"
              placeholder="Question"
              value={newFaqQuestion}
              onChange={(e) => setNewFaqQuestion(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
            />
            <input
              type="text"
              placeholder="Answer"
              value={newFaqAnswer}
              onChange={(e) => setNewFaqAnswer(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
            />
            <button
              type="button"
              onClick={handleAddFaq}
              className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium self-end transition-colors"
            >
              Add FAQ
            </button>
          </div>
        </section>

      </div>
    </div>
  )
}
