"use client";

import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// TODO: Replace with AddSpace component for Spacefly.ai
const AddSpace = () => {
  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle className="mb-4">Add Space</SheetTitle>
        <SheetDescription>
          <p className="text-gray-600">
            Use the host dashboard at <a href="/host/spaces/new" className="text-blue-600 underline">/host/spaces/new</a> to create a new space.
          </p>
        </SheetDescription>
      </SheetHeader>
    </SheetContent>
  );
};

export default AddSpace;
