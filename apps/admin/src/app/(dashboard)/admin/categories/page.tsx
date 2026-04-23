"use client";

import { useEffect, useState } from "react";
import useAuthStore from "@/stores/authStore";
import { DashboardPageHeader } from "@/components/dashboard";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AddCategory from "@/components/AddCategory";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

const PRODUCT_SERVICE_URL =
  process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || "http://localhost:8000";

const CategoriesPage = () => {
  const { token } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${PRODUCT_SERVICE_URL}/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const res = await fetch(`${PRODUCT_SERVICE_URL}/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        toast.success("Category deleted");
      } else {
        toast.error("Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Error deleting category");
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border/60 bg-card px-4 py-6 text-sm text-muted-foreground shadow-sm">
        Loading categories...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Categories"
        description="Manage space categories"
        action={
          <Sheet>
            <SheetTrigger asChild>
              <Button>
                <Plus className="size-4" />
                Add Category
              </Button>
            </SheetTrigger>
            <AddCategory />
          </Sheet>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4">Name</TableHead>
              <TableHead className="px-4">Slug</TableHead>
              <TableHead className="px-4">Description</TableHead>
              <TableHead className="px-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id} className="hover:bg-accent/30">
                <TableCell className="px-4 py-3 font-medium text-card-foreground">
                  {cat.icon ? <span className="mr-2">{cat.icon}</span> : null}
                  {cat.name}
                </TableCell>
                <TableCell className="px-4 py-3 font-mono text-muted-foreground">
                  {cat.slug}
                </TableCell>
                <TableCell className="px-4 py-3 text-muted-foreground">
                  {cat.description || "—"}
                </TableCell>
                <TableCell className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete category ${cat.name}`}
                    onClick={() => deleteCategory(cat.id)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No categories found
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CategoriesPage;
