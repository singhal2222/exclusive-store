"use client";

import React, { useEffect, useState } from "react";

import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiSmartphone,
  FiMonitor,
  FiWatch,
  FiCamera,
  FiHeadphones,
  FiShoppingBag,
  FiUser,
  FiHome,
  FiHeart,
  FiActivity,
  FiGift,
  FiShoppingCart,
  FiStar,
} from "react-icons/fi";

import { BsController, BsTablet } from "react-icons/bs";

const Categories = () => {
  // Available icons
  const icons = {
    phone: FiSmartphone,
    computer: FiMonitor,
    watch: FiWatch,
    camera: FiCamera,
    headphone: FiHeadphones,
    gamepad: BsController,
    tablet: BsTablet,

    // Main store categories
    women: FiShoppingBag,
    men: FiUser,
    electronics: FiSmartphone,
    lifestyle: FiHome,
    medicine: FiHeart,
    sports: FiActivity,
    baby: FiGift,
    grocery: FiShoppingCart,
    health: FiStar,
  };

  // Categories fetched from MongoDB
  const [categories, setCategories] = useState([]);

  // Add category form
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("phone");

  // Edit category
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryIcon, setEditCategoryIcon] = useState("phone");

  // Loading states
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Error / success messages
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/categories", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch categories");
      }

      setCategories(data?.categories || []);
    } catch (error) {
      console.error("Fetch categories error:", error);

      setError(
        error?.message || "Something went wrong while loading categories.",
      );

      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories when page loads
  useEffect(() => {
    fetchCategories();
  }, []);

  // Add category
  const handleAdd = async () => {
    const categoryName = newCategory.trim();

    // Basic frontend validation
    if (!categoryName) {
      setError("Category name is required.");
      return;
    }

    if (categoryName.length < 2 || categoryName.length > 100) {
      setError("Category name must be between 2 and 100 characters.");
      return;
    }

    try {
      setAdding(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: categoryName,
          icon: newCategoryIcon,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to create category");
      }

      // Add newly created category to UI
      if (data?.category) {
        setCategories((prevCategories) => [...prevCategories, data.category]);
      }

      // Reset form
      setNewCategory("");
      setNewCategoryIcon("phone");

      setSuccess("Category added successfully.");

      // Remove success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Add category error:", error);

      setError(
        error?.message || "Something went wrong while adding the category.",
      );
    } finally {
      setAdding(false);
    }
  };

  // Handle Enter key for add category
  const handleAddKeyDown = (e) => {
    if (e.key === "Enter") {
      handleAdd();
    }
  };

  // Open edit modal
  const handleEdit = (category) => {
    setEditingCategory(category);
    setEditCategoryName(category?.name || "");
    setEditCategoryIcon(category?.icon || "phone");

    setError("");
    setSuccess("");
  };

  // Close edit modal
  const handleCloseEdit = () => {
    if (updating) return;

    setEditingCategory(null);
    setEditCategoryName("");
    setEditCategoryIcon("phone");
  };

  // Update category
  const handleUpdate = async () => {
    if (!editingCategory?._id) {
      return;
    }

    const categoryName = editCategoryName.trim();

    // Basic frontend validation
    if (!categoryName) {
      setError("Category name is required.");
      return;
    }

    if (categoryName.length < 2 || categoryName.length > 100) {
      setError("Category name must be between 2 and 100 characters.");
      return;
    }

    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      const response = await fetch(`/api/categories/${editingCategory._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: categoryName,
          icon: editCategoryIcon,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update category");
      }

      // Update category directly in UI
      if (data?.category) {
        setCategories((prevCategories) =>
          prevCategories.map((category) =>
            category._id === data.category._id ? data.category : category,
          ),
        );
      }

      // Close modal
      setEditingCategory(null);
      setEditCategoryName("");
      setEditCategoryIcon("phone");

      setSuccess("Category updated successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Update category error:", error);

      setError(
        error?.message || "Something went wrong while updating the category.",
      );
    } finally {
      setUpdating(false);
    }
  };

  // Delete category
  const handleDelete = async (category) => {
    if (!category?._id) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(category._id);
      setError("");
      setSuccess("");

      const response = await fetch(`/api/categories/${category._id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete category");
      }

      // Remove category from UI
      setCategories((prevCategories) =>
        prevCategories.filter((item) => item._id !== category._id),
      );

      setSuccess("Category deleted successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Delete category error:", error);

      setError(
        error?.message || "Something went wrong while deleting the category.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="font-poppins">
      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="mb-5 sm:mb-8">
        <h1 className="mb-1.5 text-2xl font-semibold tracking-[2%] text-black sm:mb-2 sm:text-3xl lg:text-[36px]">
          Categories
        </h1>

        <p className="text-xs text-[#7A7A7A] sm:text-sm md:text-[15px] lg:text-[16px]">
          Manage product categories ({categories.length} total)
        </p>
      </div>

      {/* ================================================== */}
      {/* ERROR MESSAGE */}
      {/* ================================================== */}

      {error && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 sm:mb-6 sm:gap-4 sm:px-4 sm:py-3">
          <p className="text-xs text-red-600 sm:text-[14px]">{error}</p>

          <button
            type="button"
            onClick={() => setError("")}
            className="shrink-0 text-red-500 transition-colors hover:text-red-700"
            aria-label="Close error"
          >
            <FiX size={18} />
          </button>
        </div>
      )}

      {/* ================================================== */}
      {/* SUCCESS MESSAGE */}
      {/* ================================================== */}

      {success && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 sm:mb-6 sm:gap-4 sm:px-4 sm:py-3">
          <p className="text-xs text-green-600 sm:text-[14px]">{success}</p>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="shrink-0 text-green-500 transition-colors hover:text-green-700"
            aria-label="Close success"
          >
            <FiX size={18} />
          </button>
        </div>
      )}

      {/* ================================================== */}
      {/* ADD CATEGORY */}
      {/* ================================================== */}

      <div className="mb-5 rounded-xl border border-[#E5E5E5] bg-white p-4 sm:mb-6 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row">
          {/* Category Name */}
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={handleAddKeyDown}
            placeholder="New category name..."
            disabled={adding}
            className="flex-1 rounded-lg bg-[#F5F5F5] px-3 py-2.5 text-xs outline-none transition-all placeholder:text-[#7A7A7A] focus:ring-2 focus:ring-[#DB4444]/30 disabled:opacity-60 sm:px-4 sm:py-3 sm:text-[14px] lg:text-[15px]"
          />

          {/* Icon Select */}
          <select
            value={newCategoryIcon}
            onChange={(e) => setNewCategoryIcon(e.target.value)}
            disabled={adding}
            className="cursor-pointer rounded-lg bg-[#F5F5F5] px-3 py-2.5 text-xs outline-none transition-all focus:ring-2 focus:ring-[#DB4444]/30 disabled:opacity-60 sm:px-4 sm:py-3 sm:text-[14px] lg:text-[15px] md:w-52"
          >
            <option value="women">Woman's Fashion</option>

            <option value="men">Men's Fashion</option>

            <option value="electronics">Electronics</option>

            <option value="lifestyle">Home & Lifestyle</option>

            <option value="medicine">Medicine</option>

            <option value="sports">Sports & Outdoor</option>

            <option value="baby">Baby's & Toys</option>

            <option value="grocery">Groceries & Pets</option>

            <option value="health">Health & Beauty</option>

            <option value="phone">Smartphone</option>

            <option value="computer">Computer</option>

            <option value="watch">Watch</option>

            <option value="camera">Camera</option>

            <option value="headphone">Headphones</option>

            <option value="gamepad">Gaming</option>

            <option value="tablet">Tablet</option>
          </select>

          {/* Add Button */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#DB4444] px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-[#c73d3d] disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-3 sm:text-[14px] lg:text-[15px]"
          >
            <FiPlus size={18} className="sm:hidden" />
            <FiPlus size={20} className="hidden sm:block" />

            {adding ? "Adding..." : "Add"}
          </button>
        </div>
      </div>

      {/* ================================================== */}
      {/* LOADING */}
      {/* ================================================== */}

      {loading && (
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-8 text-center sm:p-12">
          <p className="text-xs text-[#7A7A7A] sm:text-[15px]">
            Loading categories...
          </p>
        </div>
      )}

      {/* ================================================== */}
      {/* EMPTY STATE */}
      {/* ================================================== */}

      {!loading && categories.length === 0 && (
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-8 text-center sm:p-12">
          <p className="mb-2 text-sm font-medium text-black sm:text-[16px]">
            No categories found
          </p>

          <p className="text-xs text-[#7A7A7A] sm:text-[14px]">
            Add your first product category using the form above.
          </p>
        </div>
      )}

      {/* ================================================== */}
      {/* CATEGORIES GRID */}
      {/* ================================================== */}

      {!loading && categories.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 md:gap-5 lg:grid-cols-4 lg:gap-6">
          {categories.map((category) => {
            const Icon = icons[category?.icon] || FiSmartphone;

            return (
              <div
                key={category._id}
                className="group flex flex-col items-center rounded-xl border border-[#E5E5E5] bg-white p-4 transition-all hover:border-[#DB4444] hover:shadow-lg sm:p-5 lg:p-6"
              >
                {/* Icon */}
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF5F5] transition-colors group-hover:bg-[#DB4444] sm:mb-4 sm:h-20 sm:w-20">
                  <Icon
                    size={28}
                    className="text-[#DB4444] transition-colors group-hover:text-white sm:hidden"
                  />
                  <Icon
                    size={36}
                    className="hidden text-[#DB4444] transition-colors group-hover:text-white sm:block"
                  />
                </div>

                {/* Category Name */}
                <p className="mb-3 wrap-break-words text-center text-sm font-medium text-black sm:mb-4 sm:text-[15px] lg:text-[16px]">
                  {category.name}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => handleEdit(category)}
                    disabled={deletingId === category._id}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Edit ${category.name}`}
                  >
                    <FiEdit2 size={16} />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDelete(category)}
                    disabled={deletingId === category._id}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Delete ${category.name}`}
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================================================== */}
      {/* EDIT MODAL */}
      {/* ================================================== */}

      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 sm:px-6">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-4 shadow-2xl sm:p-6">
            {/* Modal Header */}
            <div className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
              <h2 className="text-lg font-semibold text-black sm:text-xl lg:text-[22px]">
                Edit Category
              </h2>

              <button
                type="button"
                onClick={handleCloseEdit}
                disabled={updating}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[#F5F5F5] disabled:opacity-50"
                aria-label="Close modal"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Category Name */}
            <div className="mb-4">
              <label className="mb-2 block text-xs font-medium text-black sm:text-[14px]">
                Category Name
              </label>

              <input
                type="text"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUpdate();
                  }
                }}
                disabled={updating}
                className="w-full rounded-lg bg-[#F5F5F5] px-3 py-2.5 text-xs outline-none transition-all focus:ring-2 focus:ring-[#DB4444]/30 disabled:opacity-60 sm:px-4 sm:py-3 sm:text-[14px] lg:text-[15px]"
              />
            </div>

            {/* Icon */}
            <div className="mb-5 sm:mb-6">
              <label className="mb-2 block text-xs font-medium text-black sm:text-[14px]">
                Category Icon
              </label>

              <select
                value={editCategoryIcon}
                onChange={(e) => setEditCategoryIcon(e.target.value)}
                disabled={updating}
                className="w-full cursor-pointer rounded-lg bg-[#F5F5F5] px-3 py-2.5 text-xs outline-none transition-all focus:ring-2 focus:ring-[#DB4444]/30 disabled:opacity-60 sm:px-4 sm:py-3 sm:text-[14px] lg:text-[15px]"
              >
                <option value="women">Woman's Fashion</option>

                <option value="men">Men's Fashion</option>

                <option value="electronics">Electronics</option>

                <option value="lifestyle">Home & Lifestyle</option>

                <option value="medicine">Medicine</option>

                <option value="sports">Sports & Outdoor</option>

                <option value="baby">Baby's & Toys</option>

                <option value="grocery">Groceries & Pets</option>

                <option value="health">Health & Beauty</option>

                <option value="phone">Smartphone</option>

                <option value="computer">Computer</option>

                <option value="watch">Watch</option>

                <option value="camera">Camera</option>

                <option value="headphone">Headphones</option>

                <option value="gamepad">Gaming</option>

                <option value="tablet">Tablet</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={handleCloseEdit}
                disabled={updating}
                className="w-full rounded-lg border border-[#E5E5E5] px-5 py-2.5 text-xs font-medium text-black transition-colors hover:bg-[#F5F5F5] disabled:opacity-50 sm:w-auto sm:py-3 sm:text-[14px]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUpdate}
                disabled={updating}
                className="w-full rounded-lg bg-[#DB4444] px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-[#c73d3d] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-3 sm:text-[14px]"
              >
                {updating ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
