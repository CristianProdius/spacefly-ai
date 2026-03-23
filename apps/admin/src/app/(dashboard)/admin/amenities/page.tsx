"use client";

import { useEffect, useState } from "react";
import useAuthStore from "@/stores/authStore";
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
    return <div className="p-4">Loading amenities...</div>;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Amenities</h1>
          <p className="text-gray-500">Manage space amenities</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Amenity
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={addAmenity}
          className="bg-white border rounded-lg p-4 flex items-end gap-4"
        >
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="e.g. Wi-Fi"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category (optional)
            </label>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="e.g. Technology"
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
          >
            {adding ? "Adding..." : "Add"}
          </button>
          <button
            type="button"
            onClick={() => setShowAdd(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
        </form>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h3 className="font-medium text-gray-700">{category}</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {items.map((amenity) => (
              <div
                key={amenity.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm text-gray-900">
                  {amenity.icon && <span className="mr-2">{amenity.icon}</span>}
                  {amenity.name}
                </span>
                <button
                  onClick={() => deleteAmenity(amenity.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {amenities.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500">No amenities found</p>
        </div>
      )}
    </div>
  );
};

export default AmenitiesPage;
