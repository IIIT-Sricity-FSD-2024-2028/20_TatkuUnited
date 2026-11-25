import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from "@/store";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  superuserActions,
  updateCategory,
} from "@/store/superuser/superuser-slice";
import { BsPlus, BsFolder2 } from 'react-icons/bs';
import SummaryCards, { type SummaryStat } from '../../components/superuser/SummaryCards';
import DataTable, { type Column } from '../../components/superuser/DataTable';
import type { CategoryDocument, CreateCategoryDto, UpdateCategoryDto } from '@/models/api.models';

export default function SuperUser_ManageCategories() {
  const dispatch = useDispatch<AppDispatch>();
  const { categories, pending, error } = useSelector(
    (state: RootState) => state.superuser,
  );

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All Statuses');

  const totalCategories = categories.length;
  const activeCategories = categories.filter(cat => cat.isActive === true).length;

  const [isAddCategory, setIsAddCategory] = useState(false);

  const [editingCategoryID, setEditingCategoryID] = useState<string | null>(null);
  const editingCategory = editingCategoryID
    ? categories.find((category) => category._id === editingCategoryID) ?? null
    : null;



  const SUMMARY_STATS: SummaryStat[] = [
    { title: "Total Categories", count: totalCategories, icon: <BsFolder2 size={20} />, iconColor: "text-blue-600", bg: "bg-blue-50" },
    { title: "Active Catrgories", count: activeCategories, icon: <BsFolder2 size={20} />, iconColor: "text-green-500", bg: "bg-green-50" },
    { title: "Inactive Catrgories", count: totalCategories - activeCategories, icon: <BsFolder2 size={20} />, iconColor: "text-red-500", bg: "bg-red-50" },
  ];

  const filtered_categories = categories.filter((category) => {
    if(!category.name.toLowerCase().includes(search.toLowerCase())) return false;
    if(!(status==="All Statuses") && status==='Active' && category.isActive==false) return false;
    if(!(status==="All Statuses") && status==='Inactive' && category.isActive==true) return false;
    return true;
});


  const columns: Column<CategoryDocument>[] = [
    { header: "Category Name", render: (row) => <span className="font-medium text-slate-900">{row.name}</span> },
    { header: "Description", render: (row) => <span className="text-slate-500">{row.description}</span> },
    {
  header: "Status",
  render: (row) => (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        row.isActive
          ? 'bg-green-100 text-green-700'
          : 'bg-red-100 text-red-700'
      }`}
    >
      {row.isActive ? 'Active' : 'Inactive'}
    </span>
  ),
},
    {
      header: "Actions", render: (row) => (
        <button
          className="text-blue-600 hover:underline font-medium"
          onClick={() => {
            dispatch(superuserActions.clearError());
            setEditingCategoryID(row._id);
          }}
        >
          Edit
        </button>
      )
    },
  ];


  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const closeAdd = () => {
    setIsAddCategory(false);
    dispatch(superuserActions.clearError());
  };

  const closeEdit = () => {
    setEditingCategoryID(null);
    dispatch(superuserActions.clearError());
  };


  return (
    <div className="flex flex-col gap-6">

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Category Management</h1>
          <p className="text-slate-500 text-sm">Define and manage the platform-wide category catalog for services.</p>
        </div>
        <button
          onClick={() => {
            dispatch(superuserActions.clearError());
            setIsAddCategory(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
          <BsPlus size={20} />
          Add New Category
        </button>
      </div>

      {isAddCategory && <AddCategory onClose={closeAdd} />}
      {editingCategory && <EditCategory category={editingCategory} onClose={closeEdit} />}

      {/* Summary Cards — uses reusable SummaryCards component */}
      <SummaryCards stats={SUMMARY_STATS} />

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
        
        <div className="flex flex-col gap-1 flex-2 min-w-37.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category Status</label>
          <select
            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
            value={status}
            onChange={(e) => setStatus(e.target.value)}>
            <option
              id='all_statuses'
              value="All Statuses"
            >
              All Statuses
            </option>
            <option
              id='active'
              value="Active"
            >
              Active
            </option>
            <option
              id='inactive'
              value="Inactive"
            >
              Inactive
            </option>
          </select>
        </div>
      </div>

      {/* Data Table — uses reusable DataTable component */}
      <DataTable
        columns={columns}
        data={filtered_categories}
        rowKey={(row) => row._id}
        isLoading={pending > 0}
        error={isAddCategory || editingCategory ? null : error}
        emptyMessage="No categories found matching your search."
      />

    </div>
  );
}


interface AddCategoryProps {
  onClose: () => void;
}

interface EditCategoryProps {
  onClose: () => void;
  category: CategoryDocument;
}

function AddCategory({ onClose }: AddCategoryProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { submitting, error } = useSelector(
    (state: RootState) => state.superuser,
  );
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const dto: CreateCategoryDto = {
      name,
      description,
      imageUrl: image,
      isActive: true,
    };

    try {
      await dispatch(createCategory(dto)).unwrap();
      setName('');
      setDescription('');
      setImage('');
      onClose();
    } catch {
      // the rejected thunk stores a readable message in the slice
    }
  };
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
      <h2 className="text-lg font-bold text-slate-900 mb-4">Create New Category</h2>
      {error && (
        <div role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

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
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
          >
            {submitting ? 'Adding Category...' : 'Add Category'}
          </button>
        </div>
      </form>
    </div>
  )
}


function EditCategory({ onClose, category }: EditCategoryProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { submitting, error } = useSelector(
    (state: RootState) => state.superuser,
  );
  const [categoryName, setCategoryName] = useState(category.name);
  const [categoryDescription, setCategoryDescription] = useState(category.description);
  const [categoryImage, setCategoryImage] = useState(category.imageUrl);
  const [status, setStatus] = useState(category.isActive);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const dto: UpdateCategoryDto = {
      name: categoryName,
      description: categoryDescription,
      imageUrl: categoryImage,
      isActive: status,
    };

    try {
      await dispatch(updateCategory({ id: category._id, dto })).unwrap();
      onClose();
    } catch {
      // the rejected thunk stores a readable message in the slice
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteCategory(category._id)).unwrap();
      onClose();
    } catch {
      // the rejected thunk stores a readable message in the slice
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Edit Category</h2>
        <p className="text-sm text-slate-500 mb-6">
          Modify details for category ID: <span className="font-mono text-slate-700 text-xs">{category._id}</span>
        </p>

        {error && (
          <div role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

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

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Account Status</label>
            <span className={`text-sm font-semibold ${status === true ? 'text-green-700' : 'text-slate-500'}`}>
              {status === true ? 'Active' : 'Suspended'}
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type='checkbox'
              className="sr-only peer"
              checked={status === true}
              onChange={(e) => setStatus(e.target.checked ? true : false)}
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>

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
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
