import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PublicNavbar from "../PublicNavbar";
import { useEffect, useState } from "react";
import type { AppDispatch, RootState } from "@/store";
import { fetchCategories } from "@/store/category/category-slice";
import {
  fetchServices,
  fetchServicesByCategory,
} from "@/store/service/service-slice";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectItem,
} from "@/components/ui/select";
import ServiceCard from "../components/serviceCard";
import { Spinner } from "@/components/ui/spinner";

export default function ServiceCatalog() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { items: categories, loading: categoriesLoading } = useSelector(
    (state: RootState) => state.category,
  );
  const { items: services, loading: servicesLoading } = useSelector(
    (state: RootState) => state.service,
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    void dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (categoryFilter === "all") {
      void dispatch(fetchServices());
    } else {
      void dispatch(fetchServicesByCategory(categoryFilter));
    }
  }, [dispatch, categoryFilter]);

  const items = [
    { label: "All", value: "all" },
    ...categories.map((cat) => ({ label: cat.name, value: cat._id })),
  ];

  const loading = categoriesLoading || servicesLoading;

  if (loading)
    return (
      <div>
        <PublicNavbar
          brandInitials="TU"
          brandName="Tatku United"
          key={categoryFilter}
          onNavigate={navigate}
        />
        <div className="flex h-dvh justify-center items-center">
          <Spinner />
        </div>
      </div>
    );

  return (
    <div>
      <PublicNavbar
        brandName="Tatku United"
        brandInitials="TU"
        onNavigate={navigate}
      />
      <div className="mt-22 flex flex-row justify-between m-5">
        <h1 className="text-3xl">Explore services @ Tatku United</h1>
        <Select
          items={items}
          value={categoryFilter}
          onValueChange={(val: string | null) => setCategoryFilter(val ?? "")}
        >
          <SelectTrigger className="w-full max-w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Categories</SelectLabel>
              {items.map((cat) => {
                return (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-row flex-wrap gap-5 justify-center m-5">
        {services.map((ser, idx) => {
          return <ServiceCard key={idx} service={ser} />;
        })}
      </div>
    </div>
  );
}
