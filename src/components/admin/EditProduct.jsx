// FILE LOCATION: src/components/admin/EditProduct.jsx

"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { FiSave, FiX, FiUpload } from "react-icons/fi";
import { FaStar, FaRegStar } from "react-icons/fa";
import { uploadImage } from "@/lib/uploadImage";

const EditProduct = () => {
  const params = useParams();
  const router = useRouter();

  const id = params?.id;

  // ============================================================
  // FORM DATA
  // ============================================================
  //
  // NOTE: `rating` is NOT part of the form.
  // Ratings are computed automatically from approved customer
  // reviews and cannot be edited by the admin.
  //
  // ============================================================

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    originalPrice: "",
    stock: "",
    description: "",
    saleBadge: "",
  });

  // Read-only info shown to the admin (not editable)
  const [reviewStats, setReviewStats] = useState({
    rating: 0,
    reviewCount: 0,
  });

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryError, setCategoryError] = useState("");

  // New file selected by the user
  const [newImageFile, setNewImageFile] = useState(null);

  // Image displayed in the preview
  const [imagePreview, setImagePreview] = useState(null);

  // Existing Cloudinary public ID
  const [existingPublicId, setExistingPublicId] = useState("");

  // Whether the user removed the current image
  const [imageRemoved, setImageRemoved] = useState(false);

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -------------------- Fetch categories --------------------

  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        setCategoryError("");

        const response = await fetch("/api/categories", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Failed to fetch categories");
        }

        if (!cancelled) {
          setCategories(Array.isArray(data?.categories) ? data.categories : []);
        }
      } catch (error) {
        console.error("Fetch categories error:", error);

        if (!cancelled) {
          setCategoryError(error?.message || "Failed to load categories.");
        }
      } finally {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // -------------------- Fetch product --------------------

  useEffect(() => {
    if (!id || typeof id !== "string") {
      setLoading(false);
      setApiError("Invalid product ID.");
      return;
    }

    let cancelled = false;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setApiError("");
        setErrors({});

        const response = await fetch(`/api/products/${id}`, {
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Failed to fetch product");
        }

        const product = data?.product;

        if (!product) {
          throw new Error("Product not found");
        }

        if (cancelled) return;

        setFormData({
          name: product.name || "",

          category: product.category?._id || product.category || "",

          price:
            product.price !== null && product.price !== undefined
              ? String(product.price)
              : "",

          originalPrice:
            product.originalPrice !== null &&
            product.originalPrice !== undefined
              ? String(product.originalPrice)
              : "",

          stock:
            product.stock !== null && product.stock !== undefined
              ? String(product.stock)
              : "",

          description: product.description || "",

          saleBadge: product.saleBadge || "",
        });

        // Read-only review stats (cannot be edited here)
        setReviewStats({
          rating:
            product.rating !== null && product.rating !== undefined
              ? Number(product.rating)
              : 0,
          reviewCount:
            product.reviewCount !== null && product.reviewCount !== undefined
              ? Number(product.reviewCount)
              : 0,
        });

        setImagePreview(product.image || null);
        setExistingPublicId(product.imagePublicId || "");
        setNewImageFile(null);
        setImageRemoved(false);
      } catch (error) {
        console.error("Fetch product error:", error);

        if (!cancelled) {
          setApiError(
            error?.message || "Something went wrong while loading the product.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // -------------------- Cleanup blob URLs --------------------
  // The previous preview URL is released when the preview changes
  // or the component unmounts.

  useEffect(() => {
    if (!imagePreview || !imagePreview.startsWith("blob:")) {
      return;
    }

    return () => {
      URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // -------------------- Handle input change --------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      // The backend generates saleBadge from the actual discount.
      // Reflect that calculation in the existing UI field too.
      if (name === "price" || name === "originalPrice") {
        const price = Number(updated.price);
        const originalPrice = Number(updated.originalPrice);

        if (
          updated.price !== "" &&
          updated.originalPrice !== "" &&
          Number.isFinite(price) &&
          Number.isFinite(originalPrice) &&
          originalPrice > 0 &&
          price >= 0 &&
          price <= originalPrice
        ) {
          const discount = Math.round(
            ((originalPrice - price) / originalPrice) * 100,
          );

          updated.saleBadge = discount > 0 ? `-${discount}%` : "";
        } else if (updated.originalPrice === "" || updated.price === "") {
          updated.saleBadge = "";
        }
      }

      return updated;
    });

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      ...(name === "price" || name === "originalPrice"
        ? { saleBadge: "" }
        : {}),
    }));

    setApiError("");
  };

  // -------------------- Handle image change --------------------

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!allowedTypes.includes(file.type)) {
      alert("Please select a JPG, PNG, WebP, or GIF image.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should not exceed 5MB.");
      e.target.value = "";
      return;
    }

    setNewImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageRemoved(false);
    setApiError("");

    e.target.value = "";
  };

  // -------------------- Remove image --------------------

  const removeImage = () => {
    setNewImageFile(null);
    setImagePreview(null);
    setImageRemoved(true);
    setApiError("");
  };

  // -------------------- Validation --------------------

  const validate = () => {
    const newErrors = {};

    const name = formData.name.trim();
    const category = formData.category;
    const price = formData.price;
    const originalPrice = formData.originalPrice;
    const stock = formData.stock;
    const description = formData.description.trim();

    if (!name) {
      newErrors.name = "Product name is required";
    } else if (name.length < 2) {
      newErrors.name = "Product name must be at least 2 characters";
    } else if (name.length > 150) {
      newErrors.name = "Product name must not exceed 150 characters";
    }

    if (!category) {
      newErrors.category = "Category is required";
    }

    if (price === "") {
      newErrors.price = "Price is required";
    } else if (!Number.isFinite(Number(price)) || Number(price) < 0) {
      newErrors.price = "Enter a valid non-negative price";
    }

    if (originalPrice !== "") {
      if (
        !Number.isFinite(Number(originalPrice)) ||
        Number(originalPrice) < 0
      ) {
        newErrors.originalPrice = "Enter a valid non-negative original price";
      } else if (
        price !== "" &&
        Number.isFinite(Number(price)) &&
        Number(price) > Number(originalPrice)
      ) {
        newErrors.originalPrice =
          "Original price must be equal to or greater than the selling price";
      }
    }

    if (stock === "") {
      newErrors.stock = "Stock quantity is required";
    } else if (!Number.isFinite(Number(stock)) || Number(stock) < 0) {
      newErrors.stock = "Enter a valid non-negative stock quantity";
    } else if (!Number.isInteger(Number(stock))) {
      newErrors.stock = "Stock quantity must be a whole number";
    }

    if (!description) {
      newErrors.description = "Description is required";
    } else if (description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    } else if (description.length > 2000) {
      newErrors.description = "Description must not exceed 2000 characters";
    }

    if (formData.saleBadge.trim().length > 30) {
      newErrors.saleBadge = "Sale badge must not exceed 30 characters";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // -------------------- Cleanup newly uploaded image --------------------
  // If an upload succeeds but the product update fails, attempt to
  // remove the unused new upload. Never delete the existing image here.

  const cleanupUploadedImage = async (publicId) => {
    if (!publicId) return;

    try {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ publicId }),
      });
    } catch (error) {
      console.error("Failed to clean up newly uploaded image:", error);
    }
  };

  // -------------------- Submit --------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    setApiError("");

    if (!validate()) return;

    if (!id || typeof id !== "string") {
      setApiError("Invalid product ID.");
      return;
    }

    let newlyUploadedPublicId = "";

    try {
      setIsSubmitting(true);

      // -------------------- Calculate discount --------------------
      // The existing UI has price and originalPrice fields rather
      // than a separate discount field. Calculate the percentage
      // from those values for the API/model middleware.

      const sellingPrice = Number(formData.price);

      const originalPrice =
        formData.originalPrice === "" ? null : Number(formData.originalPrice);

      let discountPercentage = 0;

      if (originalPrice !== null && originalPrice > 0) {
        discountPercentage = Number(
          (((originalPrice - sellingPrice) / originalPrice) * 100).toFixed(4),
        );
      }

      // -------------------- Product data --------------------
      //
      // NOTE: `rating` is intentionally NOT sent.
      // The API ignores it anyway. The product keeps
      // whatever rating the review system has calculated.
      //
      const productData = {
        name: formData.name.trim(),
        category: formData.category,
        price: sellingPrice,
        originalPrice,
        discountPercentage,
        stock: Number(formData.stock),
        description: formData.description.trim(),
      };

      // Do not send image fields when the image is unchanged.
      // This keeps older products with non-Cloudinary images or
      // missing public IDs editable without changing their image.

      // -------------------- Upload replacement image --------------------

      if (newImageFile) {
        const uploaded = await uploadImage(newImageFile);

        if (!uploaded?.url || !uploaded?.publicId) {
          throw new Error(
            "Image upload did not return a valid image URL and public ID.",
          );
        }

        newlyUploadedPublicId = uploaded.publicId;

        productData.image = uploaded.url;
        productData.imagePublicId = uploaded.publicId;
      } else if (imageRemoved) {
        // The API expects both values to be empty to remove an image.
        productData.image = "";
        productData.imagePublicId = "";
      }

      // -------------------- Update product --------------------

      const response = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (!response.ok) {
        // The new image has not been attached to the product.
        if (newlyUploadedPublicId) {
          await cleanupUploadedImage(newlyUploadedPublicId);
          newlyUploadedPublicId = "";
        }

        throw new Error(data?.message || "Failed to update product");
      }

      // The new image is now associated with the saved product.
      newlyUploadedPublicId = "";

      alert("Product updated successfully!");

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      console.error("Update product error:", error);

      // If an error occurs after upload but before a successful
      // product update, remove the unused uploaded image.
      if (newlyUploadedPublicId) {
        await cleanupUploadedImage(newlyUploadedPublicId);
      }

      setApiError(
        error?.message ||
          "Something went wrong while updating the product. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------- Loading --------------------

  if (loading) {
    return (
      <div className="font-poppins">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-1.5 text-xl font-semibold tracking-[0.02em] text-black sm:mb-2 sm:text-2xl md:text-3xl lg:text-[36px]">
            Edit Product
          </h1>

          <p className="text-xs text-[#7A7A7A] sm:text-sm md:text-[15px] lg:text-[16px]">
            Loading product information...
          </p>
        </div>

        <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 text-center sm:p-10">
          <p className="text-xs text-[#7A7A7A] sm:text-[15px]">
            Loading product...
          </p>
        </div>
      </div>
    );
  }

  // -------------------- UI --------------------

  return (
    <div className="font-poppins">
      {/* Header */}

      <div className="mb-5 sm:mb-8">
        <h1 className="mb-1.5 text-xl font-semibold tracking-[0.02em] text-black sm:mb-2 sm:text-2xl md:text-3xl lg:text-[36px]">
          Edit Product
        </h1>

        <p className="text-xs text-[#7A7A7A] sm:text-sm md:text-[15px] lg:text-[16px]">
          Update product information below
        </p>
      </div>

      {/* API Error */}

      {(apiError || categoryError) && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 sm:mb-6 sm:px-4 sm:py-3">
          {apiError && (
            <p className="text-xs text-red-600 sm:text-[14px]">{apiError}</p>
          )}

          {categoryError && (
            <p className="text-xs text-red-600 sm:text-[14px]">
              {categoryError}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {/* Left Column */}

          <div className="space-y-4 sm:space-y-5 lg:col-span-2 lg:space-y-6">
            {/* Product Information */}

            <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5 lg:p-6">
              <h2 className="mb-4 text-base font-semibold text-black sm:mb-5 sm:text-lg lg:text-[20px]">
                Product Information
              </h2>

              <div className="space-y-4 sm:space-y-5">
                {/* Product Name */}

                <div>
                  <label className="mb-2 block text-xs font-medium text-black sm:text-[14px] lg:text-[15px]">
                    Product Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    maxLength={150}
                    placeholder="e.g. HAVIT HV-G92 Gamepad"
                    className={`w-full rounded-lg border px-3 py-2.5 text-xs outline-none transition-all sm:px-4 sm:py-3 sm:text-[14px] lg:text-[15px] ${
                      errors.name
                        ? "border-red-500 focus:border-red-500"
                        : "border-[#E5E5E5] focus:border-[#DB4444]"
                    }`}
                  />

                  {errors.name && (
                    <p className="mt-2 text-xs text-red-500 sm:text-[13px]">
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Description */}

                <div>
                  <label className="mb-2 block text-xs font-medium text-black sm:text-[14px] lg:text-[15px]">
                    Description *
                  </label>

                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                    maxLength={2000}
                    placeholder="Describe your product..."
                    className={`w-full resize-none rounded-lg border px-3 py-2.5 text-xs outline-none transition-all sm:px-4 sm:py-3 sm:text-[14px] lg:text-[15px] ${
                      errors.description
                        ? "border-red-500 focus:border-red-500"
                        : "border-[#E5E5E5] focus:border-[#DB4444]"
                    }`}
                  />

                  <div className="mt-1 flex justify-between gap-3">
                    {errors.description ? (
                      <p className="text-xs text-red-500 sm:text-[13px]">
                        {errors.description}
                      </p>
                    ) : (
                      <span />
                    )}

                    <span className="shrink-0 text-[11px] text-[#999] sm:text-[12px]">
                      {formData.description.length}/2000
                    </span>
                  </div>
                </div>

                {/* Category + Stock */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                  {/* Category */}

                  <div>
                    <label className="mb-2 block text-xs font-medium text-black sm:text-[14px] lg:text-[15px]">
                      Category *
                    </label>

                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      disabled={categoriesLoading}
                      className={`w-full cursor-pointer rounded-lg border px-3 py-2.5 text-xs outline-none transition-all sm:px-4 sm:py-3 sm:text-[14px] lg:text-[15px] ${
                        errors.category
                          ? "border-red-500 focus:border-red-500"
                          : "border-[#E5E5E5] focus:border-[#DB4444]"
                      } ${
                        categoriesLoading
                          ? "cursor-not-allowed bg-gray-100"
                          : ""
                      }`}
                    >
                      <option value="">
                        {categoriesLoading
                          ? "Loading Categories..."
                          : "Select Category"}
                      </option>

                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>

                    {errors.category && (
                      <p className="mt-2 text-xs text-red-500 sm:text-[13px]">
                        {errors.category}
                      </p>
                    )}
                  </div>

                  {/* Stock */}

                  <div>
                    <label className="mb-2 block text-xs font-medium text-black sm:text-[14px] lg:text-[15px]">
                      Stock Quantity *
                    </label>

                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      placeholder="e.g. 100"
                      className={`w-full rounded-lg border px-3 py-2.5 text-xs outline-none transition-all sm:px-4 sm:py-3 sm:text-[14px] lg:text-[15px] ${
                        errors.stock
                          ? "border-red-500 focus:border-red-500"
                          : "border-[#E5E5E5] focus:border-[#DB4444]"
                      }`}
                    />

                    {errors.stock && (
                      <p className="mt-2 text-xs text-red-500 sm:text-[13px]">
                        {errors.stock}
                      </p>
                    )}
                  </div>
                </div>

                {/* Price Details */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                  {/* Price */}

                  <div>
                    <label className="mb-2 block text-xs font-medium text-black sm:text-[14px] lg:text-[15px]">
                      Price (₹) *
                    </label>

                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="120"
                      className={`w-full rounded-lg border px-3 py-2.5 text-xs outline-none transition-all sm:px-4 sm:py-3 sm:text-[14px] lg:text-[15px] ${
                        errors.price
                          ? "border-red-500 focus:border-red-500"
                          : "border-[#E5E5E5] focus:border-[#DB4444]"
                      }`}
                    />

                    {errors.price && (
                      <p className="mt-2 text-xs text-red-500 sm:text-[13px]">
                        {errors.price}
                      </p>
                    )}
                  </div>

                  {/* Original Price */}

                  <div>
                    <label className="mb-2 block text-xs font-medium text-black sm:text-[14px] lg:text-[15px]">
                      Original Price (₹)
                    </label>

                    <input
                      type="number"
                      name="originalPrice"
                      value={formData.originalPrice}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="160"
                      className={`w-full rounded-lg border px-3 py-2.5 text-xs outline-none transition-all sm:px-4 sm:py-3 sm:text-[14px] lg:text-[15px] ${
                        errors.originalPrice
                          ? "border-red-500 focus:border-red-500"
                          : "border-[#E5E5E5] focus:border-[#DB4444]"
                      }`}
                    />

                    {errors.originalPrice && (
                      <p className="mt-2 text-xs text-red-500 sm:text-[13px]">
                        {errors.originalPrice}
                      </p>
                    )}
                  </div>

                  {/* Sale Badge */}

                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="mb-2 block text-xs font-medium text-black sm:text-[14px] lg:text-[15px]">
                      Sale Badge
                    </label>

                    <input
                      type="text"
                      name="saleBadge"
                      value={formData.saleBadge}
                      onChange={handleChange}
                      maxLength={30}
                      placeholder="-30%"
                      className={`w-full rounded-lg border px-3 py-2.5 text-xs outline-none transition-all sm:px-4 sm:py-3 sm:text-[14px] lg:text-[15px] ${
                        errors.saleBadge
                          ? "border-red-500 focus:border-red-500"
                          : "border-[#E5E5E5] focus:border-[#DB4444]"
                      }`}
                    />

                    {errors.saleBadge && (
                      <p className="mt-2 text-xs text-red-500 sm:text-[13px]">
                        {errors.saleBadge}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Product Image */}

            <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5 lg:p-6">
              <h2 className="mb-4 text-base font-semibold text-black sm:mb-5 sm:text-lg lg:text-[20px]">
                Product Image
              </h2>

              {imagePreview ? (
                <div className="relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-xl bg-[#F5F5F5] sm:h-48 sm:w-48">
                  <img
                    src={imagePreview}
                    alt={formData.name || "Product Preview"}
                    className="max-h-full max-w-full object-contain p-2"
                  />

                  <button
                    type="button"
                    onClick={removeImage}
                    disabled={isSubmitting}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                    aria-label="Remove image"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E5E5E5] transition-all hover:border-[#DB4444] hover:bg-[#FFF5F5] sm:h-48">
                  <FiUpload
                    size={28}
                    className="mb-3 text-[#7A7A7A] sm:hidden"
                  />
                  <FiUpload
                    size={32}
                    className="mb-3 hidden text-[#7A7A7A] sm:block"
                  />

                  <p className="mb-1 text-xs font-medium text-black sm:text-[14px] lg:text-[15px]">
                    Click to upload image
                  </p>

                  <p className="text-[11px] text-[#7A7A7A] sm:text-[12px] lg:text-[13px]">
                    PNG, JPG up to 5MB
                  </p>

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                </label>
              )}

              <p className="mt-3 text-[11px] text-[#7A7A7A] sm:text-[12px]">
                Upload a new image to replace the existing product image.
              </p>
            </div>
          </div>

          {/* Right Column */}

          <div className="space-y-4 sm:space-y-5 lg:space-y-6">
            <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5 lg:sticky lg:top-28 lg:p-6">
              <h2 className="mb-4 text-base font-semibold text-black sm:mb-5 sm:text-lg lg:text-[20px]">
                Update
              </h2>

              {/* Rating (Read-Only Info) */}

              <div className="mb-5 sm:mb-6">
                <label className="mb-2 block text-xs font-medium text-black sm:text-[14px] lg:text-[15px]">
                  Rating
                </label>

                <div className="rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] p-3.5">
                  {reviewStats.reviewCount === 0 ? (
                    <p className="text-xs text-[#7A7A7A] sm:text-[13px]">
                      No reviews yet
                    </p>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, index) =>
                            index < Math.round(reviewStats.rating) ? (
                              <FaStar
                                key={index}
                                size={16}
                                className="text-[#FFAD33]"
                              />
                            ) : (
                              <FaRegStar
                                key={index}
                                size={16}
                                className="text-gray-300"
                              />
                            ),
                          )}
                        </div>

                        <span className="text-sm font-semibold text-black">
                          {reviewStats.rating.toFixed(1)}
                        </span>
                      </div>

                      <p className="mt-2 text-[11px] text-[#7A7A7A] sm:text-[12px]">
                        Based on {reviewStats.reviewCount}{" "}
                        {reviewStats.reviewCount === 1
                          ? "approved review"
                          : "approved reviews"}
                      </p>
                    </>
                  )}
                </div>

                <p className="mt-2 text-[10px] text-[#999] sm:text-[11px]">
                  Ratings are computed automatically from approved customer
                  reviews and cannot be edited here. Moderate reviews in{" "}
                  <span className="font-medium text-[#DB4444]">Reviews</span>.
                </p>
              </div>

              {/* Buttons */}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-xs font-medium text-white shadow-lg transition-colors sm:px-6 sm:py-4 sm:text-[14px] lg:text-[15px] ${
                    isSubmitting
                      ? "cursor-not-allowed bg-gray-400 shadow-none"
                      : "bg-[#DB4444] shadow-[#DB4444]/30 hover:bg-[#c73d3d]"
                  }`}
                >
                  <FiSave size={18} className="sm:hidden" />
                  <FiSave size={20} className="hidden sm:block" />

                  {isSubmitting ? "Updating Product..." : "Update Product"}
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => router.push("/admin/products")}
                  className="w-full rounded-lg border border-[#E5E5E5] px-4 py-3 text-xs font-medium text-black transition-colors hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-4 sm:text-[14px] lg:text-[15px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;
