import { useNavigate } from "react-router-dom";
import PublicNavbar from "../PublicNavbar";
import { getCategories, getServices, getServicesByCategory } from "@/services";
import { useEffect, useState } from "react";
import type { CategoryDocument, ServiceDocument } from "@/models/api.models";
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
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [services, setServices] = useState<Array<ServiceDocument>>([]);
  const [categories, setCategories] = useState<Array<CategoryDocument>>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    try {
      async function fetCategories() {
        setCategories(await getCategories());
      }

      setLoading(true);
      fetCategories();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      async function fetchServices() {
        if (categoryFilter === "all") {
          setServices(await getServices());
        } else {
          setServices(await getServicesByCategory(categoryFilter));
        }
      }

      setLoading(true);
      fetchServices();
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  const items = [
    { label: "All", value: "all" },
    ...categories.map((cat) => ({ label: cat.name, value: cat._id })),
  ];

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
          onValueChange={(val) => setCategoryFilter(val ?? "")}
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
