import axios from 'axios';
import { type RootState } from '../../store';
import React, { useEffect, useState } from 'react';
import { BsPlus, BsFolder2, BsStarFill } from 'react-icons/bs';
import { useSelector } from 'react-redux';
import { BASE_URL } from '../../services/api';
import SummaryCards, { type SummaryStat } from '../../components/superuser/SummaryCards';
import DataTable, { type Column } from '../../components/superuser/DataTable';




export interface CategoriesResponse {
  category_id: string;
  category_name: string;
  description: string;
  average_rating: number;
  rating_count: number;
  is_available: boolean;
  icon?: string;
  image_url?: string;
}


export default function SuperUser_ManageCategories() {

  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const super_user_id = user?.id;

  const [search, setSearch] = useState('');


  const [categories, setCategories] = useState<Array<CategoriesResponse>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  let sum = 0;
  categories.forEach(category => {
    sum += category.average_rating || 0;
  })
  const totalCategories = categories.length;
  const avg_rating = totalCategories > 0 ? (sum / totalCategories).toFixed(2) : 0;



  const [isAddCategory, setIsAddCategory] = useState(false);


  const [editingCategoryID, setEditingCategoryID] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [editingCategoryDescription, setEditingCategoryDescription] = useState<string | null>(null);
  const [editingCategoryIcon, setEditingCategoryIcon] = useState<string | null | undefined>(null);
  const [editingCategoryImage, setEditingCategoryImage] = useState<string | null | undefined>(null);



  const SUMMARY_STATS: SummaryStat[] = [
    { title: "Total Categories", count: totalCategories, icon: <BsFolder2 size={20} />, iconColor: "text-blue-600", bg: "bg-blue-50" },
    { title: "Avg Rating", count: avg_rating, icon: <BsStarFill size={20} />, iconColor: "text-amber-500", bg: "bg-amber-50" },
  ];

  const filtered_categories = categories.filter((category) =>
    category.category_name.toLowerCase().includes(search.toLowerCase())
  );


  const columns: Column<CategoriesResponse>[] = [
    { header: "Category Name", render: (row) => <span className="font-medium text-slate-900">{row.category_name}</span> },
    { header: "Description", render: (row) => <span className="text-slate-500">{row.description}</span> },
    {
      header: "Rating", render: (row) => (
        <div className="flex items-center gap-1.5 font-medium text-slate-700">
          <BsStarFill className="text-amber-400" />
          {row.average_rating}
        </div>
      )
    },
    {
      header: "Actions", render: (row) => (
        <button
          className="text-blue-600 hover:underline font-medium"
          onClick={() => { setEditingCategoryID(row.category_id); setEditingCategoryName(row.category_name); setEditingCategoryDescription(row.description); setEditingCategoryIcon(row.icon); setEditingCategoryImage(row.image_url); }}
        >
          Edit
        </button>
      )
    },
  ];


  const fetchAllCategories = async () => {
    if (!token || !super_user_id) return;
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(`${BASE_URL}/categories`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-role": "super_user,"
          },
        },
      );
      setCategories(response.data);
      console.log(response.data);
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
    fetchAllCategories();
  }, [token, super_user_id])


  return (
    <div className="flex flex-col gap-6">

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Category Management</h1>
          <p className="text-slate-500 text-sm">Define and manage the platform-wide category catalog for services.</p>
        </div>
        <button
          onClick={() => setIsAddCategory(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
          <BsPlus size={20} />
          Add New Category
        </button>
      </div>

      {isAddCategory && (<AddCategory
        token={token}
        super_user_id={super_user_id}
        onClose={() => setIsAddCategory(false)}
        refreshCategories={fetchAllCategories}
      />)
      }

      {editingCategoryID && (<EditCategory
        token={token}
        super_user_id={super_user_id}
        onClose={() => setEditingCategoryID(null)}
        refreshCategories={fetchAllCategories}
        category_id={editingCategoryID}
        category_name={editingCategoryName}
        description={editingCategoryDescription}
        icon={editingCategoryIcon}
        image_url={editingCategoryImage}
      />)}

      {/* Summary Cards — uses reusable SummaryCards component */}
      <SummaryCards stats={SUMMARY_STATS} gridClassName="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl" />

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1 flex-1 min-w-50">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search Categories</label>
          <input
            type='text'
            placeholder="Search by name..."
            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* Placeholder for future filters if needed, keeps the layout consistent */}
        <div className="flex-2"></div>
      </div>

      {/* Data Table — uses reusable DataTable component */}
      <DataTable
        columns={columns}
        data={filtered_categories}
        rowKey={(row) => row.category_id}
        isLoading={isLoading}
        error={error}
        emptyMessage="No categories found matching your search."
      />

    </div>
  );
}


interface AddCategoryProps {
  onClose: () => void;
  token: string | null;
  super_user_id: string | undefined;
  refreshCategories: () => void;
}

interface EditCategoryProps {
  onClose: () => void;
  token: string | null;
  super_user_id: string | undefined;
  refreshCategories: () => void;
  category_id: string | null;
  category_name: string | null;
  description: string | null;
  icon: string | null | undefined
  image_url: string | null | undefined
}

function AddCategory({ onClose, token, super_user_id, refreshCategories }: AddCategoryProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [image, setImage] = useState('');

  const onAddCategory = async (newCategory: any) => {
    if (!token || !super_user_id) return;

    try {
      const response = await axios.post(`${BASE_URL}/categories`, newCategory,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-role': "super_user",
          },
        }
      );

      console.log(response.data);
      onClose();
      refreshCategories();
    }
    catch (err) {
      console.error("Error Adding New Category", err);
    }

  }

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();

    const newCategory = {
      category_name: name,
      description: description,
      icon: icon,
      image_url: image,
    };
    onAddCategory(newCategory);

    setName('');
    setDescription('');
    setIcon('');
    setImage('');
  }
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
      <h2 className="text-lg font-bold text-slate-900 mb-4">Create New Category</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Home Cleaning"
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of services"
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Icon Identifier</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="e.g. BsFolder2"
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Image URL</label>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              required
            />
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
            Add Category
          </button>
        </div>
      </form>
    </div>
  )
}


function EditCategory({ onClose, token, super_user_id, refreshCategories, category_id, category_name, description, icon, image_url }: EditCategoryProps) {
  const [categoryName, setCategoryName] = useState(category_name);
  const [categoryDescription, setCategoryDescription] = useState(description);
  const [categoryIcon, setCategoryIcon] = useState(icon);
  const [categoryImage, setCategoryImage] = useState(image_url);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (!token || !super_user_id) return;

    try {
      const updatedCategory =
      {
        category_name: categoryName,
        description: categoryDescription,
        icon: categoryIcon,
        image_url: categoryImage,
      };

      const response = await axios.patch(`${BASE_URL}/categories/${category_id}`, updatedCategory,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-role": "super_user",
          },
        }
      );
      console.log(response.data);
      onClose();
      refreshCategories();
    }
    catch (err) {
      console.error("Couldnt save the changes", err);
    }
  }

  const handleDelete = async () => {
    if (!token || !super_user_id) return;

    try {

      const response = await axios.delete(`${BASE_URL}/categories/${category_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-role": "super_user",
          },
        }
      );
      console.log(response.data);
      onClose();
      refreshCategories();
    }
    catch (err) {
      console.error("Couldnt delete the category", err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Edit Category</h2>
        <p className="text-sm text-slate-500 mb-6">
          Modify details for category ID: <span className="font-mono text-slate-700 text-xs">{category_id}</span>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category Name</label>
            <input
              type="text"
              value={categoryName || ""}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Home Cleaning"
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
            <input
              type="text"
              value={categoryDescription || ""}
              onChange={(e) => setCategoryDescription(e.target.value)}
              placeholder="Brief description of services"
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Icon Identifier</label>
            <input
              type="text"
              value={categoryIcon || ""}
              onChange={(e) => setCategoryIcon(e.target.value)}
              placeholder="e.g. BsFolder2"
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Image URL</label>
            <input
              type="text"
              value={categoryImage || ""}
              onChange={(e) => setCategoryImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              required
            />
          </div>

          <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={handleDelete}
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
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
