import axios from 'axios';
import { useContext } from 'react';
import AuthContext from '../../common/AuthContext';
import React, { useEffect, useState } from 'react';
import { BASE_URL } from "../../services/endpoints";
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




export interface HowItWorksStep {
  title: string;
  desc: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ServiceCategory {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

interface ServicesResponse {
  _id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  price: number;              
  duration: number;           
  rating: number;
  reviewCount: number;
  isActive: boolean;
  imageUrls: string[];
  whatIsCovered?: string[];
  whatIsNotCovered?: string[];
  howItWorks?: HowItWorksStep[];
  faq?: FaqItem[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}



export default function SuperUser_ManageServices() {
  const authContext = useContext(AuthContext);
  const token = authContext?.authDetails?.token;
  const user = authContext?.authDetails?.user;
  const super_user_id = user?.id;


  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all-categories');

  const [services, setServices] = useState<Array<ServicesResponse>>([]);
  const [categories, setCategories] = useState<Array<CategoriesResponse>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalServices = services.length;
  const activeServices = services.filter(s => s.isActive).length;

  const [isAddService, setIsAddService] = useState(false);
  const [editingService, setEditingService] = useState<ServicesResponse | null>(null);

  // Hardcoded stats for UI - replace with dynamic counts
  const SUMMARY_STATS: SummaryStat[] = [
    { title: "Total Services", count: totalServices, icon: <BsCart2 size={24} />, iconColor: "text-blue-600", bg: "bg-blue-50" },
    { title: "Active Services", count: activeServices, icon: <BsCheckCircle size={24} />, iconColor: "text-green-600", bg: "bg-green-50" },
    { title: "Inactive Services", count: totalServices - activeServices, icon: <BsExclamationCircle size={24} />, iconColor: "text-orange-500", bg: "bg-orange-50" },
  ];

  const filteredServices = services.filter(svc => {

    const matchesSearch = svc.name.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = category === 'all-categories' || svc.category?._id === category;

    return matchesSearch && matchesCategory;
  });


  const columns: Column<ServicesResponse>[] = [
  { 
    header: "Service Name", 
    render: (row) => <span className="font-medium text-slate-900">{row.name}</span> 
  },
  { 
    header: "Category", 
    render: (row) => <>{row.category?.name || "Unknown Category"}</>
  },
  { 
    header: "Price", 
    render: (row) => <span className="font-semibold text-slate-900">₹{(row.price / 100).toFixed(0)}</span> 
  },
  { 
    header: "Description", 
    render: (row) => <span className="text-slate-500">{row.description}</span>, 
    cellClassName: "truncate max-w-[200px]" 
  },
  {
    header: "Rating", 
    render: (row) => (
      <div className="flex items-center gap-1.5 font-medium text-slate-700">
        <BsStarFill className="text-amber-400" />
        {row.rating || 0}
      </div>
    )
  },
  {
    header: "Status", 
    render: (row) => (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {row.isActive ? 'Active' : 'Inactive'}
      </span>
    )
  },
  {
    header: "Actions", 
    render: (row) => (
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
          },
        },
      ),
      axios.get(`${BASE_URL}/categories`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      ),
      ])

      setServices(servicesRes.data);
      setCategories(categoriesRes.data);


    }
    catch (err) {
      setError("Failed to fetch services. Please check your connection.");
      console.error(err);
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
        categories={categories}
      />)
      }
      {editingService && (
        <EditService
          token={token}
          super_user_id={super_user_id}
          onClose={() => setEditingService(null)}
          refreshServices={fetchAllServices}
          categories={categories}
          service={editingService}
        />
      )}

      {/* Summary Cards — uses reusable SummaryCards component */}
      <SummaryCards stats={SUMMARY_STATS} />

      {/* Standardized Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">

        <div className="flex flex-col gap-1 flex-2 min-w-50">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search Services</label>
          <input
            type="text"
            placeholder="Search by name..."
            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-50">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category Filter</label>
          <select
            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >

            <option value="all-categories">All Categories</option>

            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}

          </select>
        </div>

        <button
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors h-9.5"
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
        rowKey={(row) => row._id}
        isLoading={isLoading}
        error={error}
        emptyMessage="No services found matching your search."
      />

    </div>
  );
}




interface AddServiceProps {
  onClose: () => void;
  token: string | null | undefined;
  super_user_id: string | undefined;
  refreshServices: () => void;
  categories: CategoriesResponse[];
}

interface EditServiceProps {
  onClose: () => void;
  token: string | null | undefined;
  super_user_id: string | undefined;
  refreshServices: () => void;
  categories: CategoriesResponse[];
  service: ServicesResponse; // Pass the whole service object!
}


function AddService({ onClose, token, super_user_id, refreshServices, categories }: AddServiceProps) {
  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [basePrice, setBasePrice] = useState<number | ''>('');
  const [duration, setDuration] = useState<number | ''>('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  const handleAddImage = () => {
    if(!newImageUrl.trim()) return;
    setImageUrls([...imageUrls, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(imageUrls.filter((_,i) => i!==index));
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (!token || !super_user_id) return;

    if (!categoryId) {
      return;
    }

    const newService = {
      name: serviceName,
      category: categoryId,
      description: description,
      price: Math.round(Number(basePrice) * 100),
      duration: Number(duration),
      isActive: isAvailable,
      imageUrls: imageUrls,
    };

    try {
      const response = await axios.post(`${BASE_URL}/services`, newService, {
        headers: {
          Authorization: `Bearer ${token}`,
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
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
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

          <div className="flex flex-col gap-3 md:col-span-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Service Images</label>
            {imageUrls.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                No images added yet. Add an image URL below.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {imageUrls.map((url, index) => (
                  <div key={index} className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <img src={url} alt={`preview-${index}`} className="w-10 h-10 object-cover rounded border border-slate-200 shrink-0" />
                      <span className="text-xs text-slate-600 truncate">{url}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold shrink-0 px-2 py-1"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter image URL (e.g. https://example.com/photo.jpg)"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="flex-1 p-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-3 py-2 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-900 transition-colors shrink-0"
              >
                Add Image
              </button>
            </div>
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
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
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


function EditService({ onClose, token, super_user_id, refreshServices, categories, service }: EditServiceProps) 
{

  const [serviceName, setServiceName] = useState(service.name || '');
  const [description, setDescription] = useState(service.description || '');
  const [categoryId, setCategoryId] = useState(service.category?._id || '');
  const [basePrice, setBasePrice] = useState<number | ''>(service.price != null ? service.price/100 : '');
  const [duration, setDuration] = useState<number | ''>(service.duration || '');
  const [isAvailable, setIsAvailable] = useState(service.isActive);


  const [imageUrls, setImageUrls] = useState<string[]>(service.imageUrls || []);
  const [newImageUrl, setNewImageUrl] = useState('');


  const [whatIsCovered, setWhatIsCovered] = useState(service.whatIsCovered?.join(', ') || '');
  const [whatIsNotCovered, setWhatIsNotCovered] = useState(service.whatIsNotCovered?.join(', ') || '');

  const [steps, setSteps] = useState<Array<{ title: string; desc: string }>>(
  service.howItWorks || []
);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepDesc, setNewStepDesc] = useState('');

  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>(
  service.faq || []
);
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');



  
  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setImageUrls([...imageUrls, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };
  
  const handleAddStep = () => {
    if (!newStepTitle.trim() || !newStepDesc.trim()) return;
    setSteps([...steps, { title: newStepTitle.trim(), desc: newStepDesc.trim() }]);
    setNewStepTitle('');
    setNewStepDesc('');
  };
  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };
  
  const handleAddFaq = () => {
    if (!token || !newFaqQuestion.trim() || !newFaqAnswer.trim()) return;
    setFaqs([...faqs, { question: newFaqQuestion.trim(), answer: newFaqAnswer.trim() }]);
    setNewFaqQuestion('');
    setNewFaqAnswer('');
  };

  const handleRemoveFaq = (index: number) => {
    setFaqs(faqs.filter((_,i) => i!=index));
  }

  const handleDelete = async () => 
  {
    if(!token || !super_user_id) return;

    try
    {
      const response = await axios.delete(`${BASE_URL}/services/${service._id}`,  
        {
          headers: {
            Authorization: `Bearer ${token}`,
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


  const handleUpdateService = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if(!token || !super_user_id) return;

    try
    {
      const updatedService = 
      {
        name: serviceName,
        category: categoryId,
        description: description,
        price: Math.round(Number(basePrice) * 100),
        duration: Number(duration),
        isActive: isAvailable,
        imageUrls: imageUrls,
        whatIsCovered: whatIsCovered
          ? whatIsCovered.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        whatIsNotCovered: whatIsNotCovered
          ? whatIsNotCovered.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        howItWorks: steps,
        faq: faqs,
      };

      await axios.patch(`${BASE_URL}/services/${service._id}`, updatedService, {
        headers: { Authorization: `Bearer ${token}` }
      });

      refreshServices();
      onClose();
    } 
    catch (err) 
    {
    console.error("Error updating service:", err);
     }
   }



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      {/* Container has max-h to allow scrolling for this large form */}
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-3xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Edit Service</h2>
        <p className="text-sm text-slate-500 mb-6">
          Modifying details for: <span className="font-semibold text-slate-700">{service.name}</span>
        </p>

        <form onSubmit={handleUpdateService} className="flex flex-col gap-8">

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
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
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

              <div className="flex flex-col gap-3 md:col-span-2 border-t border-slate-100 pt-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Service Images</label>
                {/* Display all existing images */}
                {imageUrls.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                    No images added yet. Add an image URL below.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2 overflow-hidden">
                          {/* Small image preview */}
                          <img
                            src={url}
                            alt={`preview-${index}`}
                            className="w-10 h-10 object-cover rounded border border-slate-200 shrink-0"
                            
                          />
                          <span className="text-xs text-slate-600 truncate">{url}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold shrink-0 px-2 py-1"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Input to add a new image URL */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter image URL (e.g. https://example.com/photo.jpg)"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="flex-1 p-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-3 py-2 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-900 transition-colors shrink-0"
                  >
                    Add Image
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 resize-none" required />
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Service Availability</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  <span className="ml-3 text-sm font-bold text-slate-700">{isAvailable ? 'Active' : 'Inactive'}</span>
                </label>
              </div>
            </div>
          </section>

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

              <div className="md:col-span-2 flex flex-col gap-3 mt-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">How It Works Steps</label>

              {steps.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                  No steps added yet. Add steps below.
                </p>
              ) : (
                steps.map((step, index) => (
                  <div key={index} className="flex justify-between items-start bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-xs font-bold text-blue-600 block">Step {index + 1}: {step.title}</span>
                      <span className="text-xs text-slate-600">{step.desc}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(index)}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}


              <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Add Next Step</span>
                <input
                  type="text"
                  placeholder="Step Title (e.g. Booking Confirmation)"
                  value={newStepTitle}
                  onChange={(e) => setNewStepTitle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
                <input
                  type="text"
                  placeholder="Step Description (e.g. Our expert will arrive at your home)"
                  value={newStepDesc}
                  onChange={(e) => setNewStepDesc(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="self-end px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-900 transition-colors"
                >
                  Add Step
                </button>
              </div>
            </div>
            </div>
          </section>

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

                    <button
                      type="button"
                      onClick={() => handleRemoveFaq(i)}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold"
                    >
                      Remove
                    </button>

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

        

      </div>
    </div>
  )
}
