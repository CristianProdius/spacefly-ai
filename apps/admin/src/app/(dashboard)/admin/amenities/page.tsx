"use client";

import { useEffect, useState } from "react";
import useAuthStore from "@/stores/authStore";
import { DashboardPageHeader } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

interface Amenity {
  id: number;
  name: string;
  icon: string | null;
  category: string | null;
}

const PRODUCT_SERVICE_URL =
  process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || "http://localhost:8000";

const AmenitiesPage = () => {
  const { token } = useAuthStore();
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchAmenities();
  }, []);

  const fetchAmenities = async () => {
    try {
      const res = await fetch(`${PRODUCT_SERVICE_URL}/amenities`);
      if (res.ok) {
        const data = await res.json();
        setAmenities(data);
      }
    } catch (error) {
      console.error("Error fetching amenities:", error);
    } finally {
      setLoading(false);
    }
  };

  const addAmenity = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);

    try {
      const res = await fetch(`${PRODUCT_SERVICE_URL}/amenities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName,
          category: newCategory || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAmenities((prev) => [...prev, data]);
        setNewName("");
        setNewCategory("");
        setShowAdd(false);
        toast.success("Amenity added");
      } else {
        toast.error("Failed to add amenity");
      }
    } catch (error) {
      console.error("Error adding amenity:", error);
      toast.error("Error adding amenity");
    } finally {
      setAdding(false);
    }
  };

  const deleteAmenity = async (id: number) => {
    if (!confirm("Are you sure you want to delete this amenity?")) return;

    try {
      const res = await fetch(`${PRODUCT_SERVICE_URL}/amenities/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setAmenities((prev) => prev.filter((a) => a.id !== id));
        toast.success("Amenity deleted");
      } else {
        toast.error("Failed to delete amenity");
      }
    } catch (error) {
      console.error("Error deleting amenity:", error);
      toast.error("Error deleting amenity");
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border/60 bg-card px-4 py-6 text-sm text-muted-foreground shadow-sm">
        Loading amenities...
      </div>
    );
  }

  // Group amenities by category
  const grouped = amenities.reduce(
    (acc, a) => {
      const cat = a.category || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(a);
      return acc;
    },
    {} as Record<string, Amenity[]>
  );

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Amenities"
        description="Manage space amenities"
        action={
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="size-4" />
            Add Amenity
          </Button>
        }
      />

      {showAdd && (
        <Card className="gap-0 border-border/60 bg-card shadow-sm">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-base">Add amenity</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form
              onSubmit={addAmenity}
              className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]"
            >
              <div className="space-y-2">
                <label
                  htmlFor="amenity-name"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  Name
                </label>
                <Input
                  id="amenity-name"
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Wi-Fi"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="amenity-category"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  Category (optional)
                </label>
                <Input
                  id="amenity-category"
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Technology"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={adding}>
                  {adding ? "Adding..." : "Add"}
                </Button>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAdd(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <div
          key={category}
          className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm"
        >
          <div className="border-b border-border/60 bg-muted/40 px-4 py-3">
            <h3 className="font-medium text-card-foreground">{category}</h3>
          </div>
          <div className="divide-y divide-border/60">
            {items.map((amenity) => (
              <div
                key={amenity.id}
                className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-accent/30"
              >
                <span className="text-sm text-card-foreground">
                  {amenity.icon ? <span className="mr-2">{amenity.icon}</span> : null}
                  {amenity.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete amenity ${amenity.name}`}
                  onClick={() => deleteAmenity(amenity.id)}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {amenities.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/60 bg-card px-6 py-12 text-center shadow-sm">
          <p className="text-muted-foreground">No amenities found</p>
        </div>
      )}
    </div>
  );
};

export default AmenitiesPage;
