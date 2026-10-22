// FILE LOCATION: src/components/admin/AddProduct.jsx

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiUpload, FiX, FiSave } from "react-icons/fi";
import { uploadImage } from "@/lib/uploadImage";

// ============================================================
// INITIAL FORM DATA
// ============================================================
//
// NOTE: `rating` is intentionally NOT part of the form.
// Ratings are computed automatically from approved customer
// reviews. New products always start with rating = 0.
//
// ============================================================

const initialFormData = {
  name: "",
  category: "",
  originalPrice: "",
  discountPercentage: "0",
  stock: "",
  description: "",
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const roundToTwoDecimals = (value) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const AddProduct = () => {
  const router = useRouter();

  const [formData, setFormData] = useState(initialFormData);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -------------------- Calculate pricing --------------------

  const pricing = useMemo(() => {
    const originalPrice = Number(formData.originalPrice);
    const discountPercentage = Number(formData.discountPercentage);

    const hasOriginalPrice =
      formData.originalPrice.trim() !== "" &&
      Number.isFinite(originalPrice) &&
      originalPrice >= 0;

    const hasDiscount =
      formData.discountPercentage.trim() !== "" &&
      Number.isFinite(discountPercentage) &&
      discountPercentage >= 0 &&
      discountPercentage <= 100;

    if (!hasOriginalPrice || !hasDiscount) {
      return {
        sellingPrice: null,
        savings: null,
        saleBadge: "",
      };
    }

    const sellingPrice = roundToTwoDecimals(
      originalPrice * (1 - discountPercentage / 100),
    );

    const savings = roundToTwoDecimals(originalPrice - sellingPrice);

    return {
      sellingPrice,
      savings,
      saleBadge: discountPercentage > 0 ? `-${discountPercentage}%` : "",
    };
  }, [formData.originalPrice, formData.discountPercentage]);

  // -------------------- Fetch categories --------------------

  useEffect(() => {
    const controller = new AbortController();

    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        setApiError("");

        const response = await fetch("/api/categories", {
          credentials: "include",
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.message || "Failed to fetch categories.");
        }

        if (!Array.isArray(data?.categories)) {
          throw new Error("Invalid categories response from server.");
        }

        setCategories(data.categories);
      } catch (error) {
        if (error?.name === "AbortError") return;

        console.error("Fetch categories error:", error);

        setApiError(error?.message || "Failed to load categories.");
      } finally {
        if (!controller.signal.aborted) {
          setCategoriesLoading(false);
        }
      }
    };

    fetchCategories();

    return () => controller.abort();
  }, []);

  // -------------------- Clean up image preview URLs --------------------

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // -------------------- Handle input changes --------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      ...(name === "originalPrice" || name === "discountPercentage"
        ? {
            originalPrice: "",
            discountPercentage: "",
          }
        : {}),
    }));

    setApiError("");
  };

  // -------------------- Handle image selection --------------------

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setApiError("Please select a JPG, PNG, or WEBP image.");

      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setApiError("Image size should not exceed 5MB.");

      e.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setImage(file);
    setImagePreview(previewUrl);
    setApiError("");

    e.target.value = "";
  };

  // -------------------- Remove selected image --------------------

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    setApiError("");
  };

  // -------------------- Validate form data --------------------

  const validate = () => {
    const newErrors = {};

    const name = formData.name.trim();
    const category = formData.category.trim();
    const originalPrice = formData.originalPrice.trim();
    const discountPercentage = formData.discountPercentage.trim();
    const stock = formData.stock.trim();
    const description = formData.description.trim();

    // Product name
    if (!name) {
      newErrors.name = "Product name is required.";
    } else if (name.length < 2) {
      newErrors.name = "Product name must be at least 2 characters.";
    } else if (name.length > 150) {
      newErrors.name = "Product name must not exceed 150 characters.";
    }

    // Category
    if (!category) {
      newErrors.category = "Category is required.";
    }

    // Original price
    if (originalPrice === "") {
      newErrors.originalPrice = "Original price is required.";
    } else if (
      !Number.isFinite(Number(originalPrice)) ||
      Number(originalPrice) < 0
    ) {
      newErrors.originalPrice = "Enter a valid non-negative price.";
    }

    // Discount percentage
    if (discountPercentage === "") {
      newErrors.discountPercentage = "Discount percentage is required.";
    } else if (
      !Number.isFinite(Number(discountPercentage)) ||
      Number(discountPercentage) < 0 ||
      Number(discountPercentage) > 100
    ) {
      newErrors.discountPercentage = "Discount must be between 0% and 100%.";
    }

    // A discount requires a positive original price.
    if (
      originalPrice !== "" &&
      discountPercentage !== "" &&
      Number.isFinite(Number(originalPrice)) &&
      Number.isFinite(Number(discountPercentage)) &&
      Number(originalPrice) === 0 &&
      Number(discountPercentage) > 0
    ) {
      newErrors.originalPrice =
        "Original price must be greater than zero when a discount is applied.";
    }

    // Stock
    if (stock === "") {
      newErrors.stock = "Stock quantity is required.";
    } else if (
      !Number.isFinite(Number(stock)) ||
      Number(stock) < 0 ||
      !Number.isInteger(Number(stock))
    ) {
      newErrors.stock = "Stock must be a non-negative whole number.";
    }

    // Description
    if (!description) {
      newErrors.description = "Description is required.";
    } else if (description.length < 10) {
      newErrors.description = "Description must be at least 10 characters.";
    } else if (description.length > 2000) {
      newErrors.description = "Description must not exceed 2000 characters.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // -------------------- Clean up an uploaded image if creation fails --------------------

  const deleteUploadedImage = async (publicId) => {
    if (
      typeof publicId !== "string" ||
      !publicId.startsWith("ecommerce/products/")
    ) {
      return;
    }

    try {
      const response = await fetch("/api/upload", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ publicId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        console.error(
          "Uploaded image cleanup failed:",
          data?.message || response.statusText,
        );
      }
    } catch (error) {
      console.error("Uploaded image cleanup error:", error);
    }
  };

  // -------------------- Submit product --------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    setApiError("");

    if (!validate()) return;

    if (categoriesLoading) {
      setApiError("Please wait until categories finish loading.");
      return;
    }

    if (categories.length === 0) {
      setApiError(
        "No categories are available. Please create or activate a category first.",
      );
      return;
    }

    let uploadedPublicId = "";
    let productCreated = false;

    try {
      setIsSubmitting(true);

      let imageUrl = "";
      let imagePublicId = "";

      // Upload the selected image first, if any.
      if (image) {
        const uploaded = await uploadImage(image);

        if (!uploaded?.url || !uploaded?.publicId) {
          throw new Error(
            "Image upload did not return a valid image URL and public ID.",
          );
        }

        imageUrl = uploaded.url;
        imagePublicId = uploaded.publicId;
        uploadedPublicId = uploaded.publicId;
      }

      // Recalculate the selling price before sending the request.
      // The API/model should also calculate it server-side.
      const originalPrice = Number(formData.originalPrice);
      const discountPercentage = Number(formData.discountPercentage);

      const sellingPrice = roundToTwoDecimals(
        originalPrice * (1 - discountPercentage / 100),
      );

      // NOTE: `rating` is intentionally NOT sent.
      // The API ignores it anyway and defaults to 0.
      const productData = {
        name: formData.name.trim(),
        category: formData.category,
        originalPrice,
        discountPercentage,
        price: sellingPrice,
        stock: Number(formData.stock),
        description: formData.description.trim(),
        saleBadge: discountPercentage > 0 ? `-${discountPercentage}%` : "",
        image: imageUrl,
        imagePublicId,
      };

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(productData),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to create product.");
      }

      if (data?.success === false) {
        throw new Error(data?.message || "Failed to create product.");
      }

      productCreated = true;

      alert("Product added successfully!");

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      console.error("Create product error:", error);

      // If upload succeeded but product creation failed,
      // try to remove the unused Cloudinary image.
      if (uploadedPublicId && !productCreated) {
        await deleteUploadedImage(uploadedPublicId);
      }

      setApiError(
        error?.message ||
          "Something went wrong while creating the product. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------- Reusable input styles --------------------

  const inputClass = (field) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all sm:px-4 sm:py-3 ${
      errors[field]
        ? "border-red-500 focus:border-red-500"
        : "border-[#E5E5E5] focus:border-[#DB4444]"
    }`;

  const labelClass = "mb-2 block text-sm font-medium text-black lg:text-[15px]";

  const errorText = (field) =>
    errors[field] ? (
      <p className="mt-2 text-xs text-red-500 sm:text-[13px]">
        {errors[field]}
      </p>
    ) : null;

  // -------------------- UI --------------------

  return (
    <div className="font-poppins">
      <div className="mb-5 sm:mb-8">
        <h1 className="mb-2 text-xl font-semibold tracking-[0.02em] text-black sm:text-2xl md:text-3xl lg:text-[36px]">
          Add New Product
        </h1>
        <p className="text-sm text-[#7A7A7A] md:text-[15px] lg:text-base">
          Fill in the details below to add a new product to your store.
        </p>
      </div>

      {apiError && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
          {/* Main column */}
          <div className="space-y-5 lg:col-span-2 lg:space-y-6">
            {/* Product information */}
            <section className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5 lg:p-6">
              <h2 className="mb-5 text-lg font-semibold text-black lg:text-xl">
                Product Information
              </h2>

              <div className="space-y-5">
                <div>
                  <label className={labelClass}>Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. HAVIT HV-G92 Gamepad"
                    maxLength={150}
                    className={inputClass("name")}
                  />
                  {errorText("name")}
                </div>

                <div>
                  <label className={labelClass}>Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                    maxLength={2000}
                    placeholder="Describe your product..."
                    className={`${inputClass("description")} resize-none`}
                  />
                  <div className="mt-1 flex justify-between gap-3">
                    {errorText("description") || <span />}
                    <span className="shrink-0 text-xs text-[#999]">
                      {formData.description.length}/2000
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      disabled={categoriesLoading}
                      className={`${inputClass("category")} ${
                        categoriesLoading
                          ? "cursor-not-allowed bg-gray-100"
                          : "cursor-pointer"
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
                    {errorText("category")}
                  </div>

                  <div>
                    <label className={labelClass}>Stock Quantity *</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      placeholder="e.g. 100"
                      min="0"
                      step="1"
                      className={inputClass("stock")}
                    />
                    {errorText("stock")}
                  </div>
                </div>
              </div>
            </section>

            {/* Pricing */}
            <section className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5 lg:p-6">
              <h2 className="mb-2 text-lg font-semibold text-black lg:text-xl">
                Pricing Details
              </h2>
              <p className="mb-5 text-sm text-[#7A7A7A]">
                Enter the original price and discount. The selling price is
                calculated automatically.
              </p>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Original Price (₹) *</label>
                  <input
                    type="number"
                    name="originalPrice"
                    value={formData.originalPrice}
                    onChange={handleChange}
                    placeholder="2000"
                    min="0"
                    step="0.01"
                    className={inputClass("originalPrice")}
                  />
                  {errorText("originalPrice")}
                </div>

                <div>
                  <label className={labelClass}>Sale Discount (%) *</label>
                  <input
                    type="number"
                    name="discountPercentage"
                    value={formData.discountPercentage}
                    onChange={handleChange}
                    placeholder="25"
                    min="0"
                    max="100"
                    step="0.01"
                    className={inputClass("discountPercentage")}
                  />
                  {errorText("discountPercentage")}
                  <p className="mt-1 text-xs text-[#7A7A7A]">
                    Enter 0 for no discount.
                  </p>
                </div>
              </div>

              {/* Live price summary */}
              <div className="mt-6 rounded-xl border border-[#F1D0D0] bg-[#FFF8F8] p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-black sm:text-base">
                    Price Preview
                  </h3>

                  {pricing.saleBadge && (
                    <span className="rounded-md bg-[#DB4444] px-3 py-1 text-sm font-semibold text-white">
                      {pricing.saleBadge} OFF
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="mb-1 text-xs text-[#7A7A7A] sm:text-sm">
                      Original Price
                    </p>
                    <p className="text-lg font-medium text-black sm:text-xl">
                      {formData.originalPrice.trim() !== "" &&
                      Number.isFinite(Number(formData.originalPrice)) &&
                      Number(formData.originalPrice) >= 0
                        ? formatPrice(Number(formData.originalPrice))
                        : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs text-[#7A7A7A] sm:text-sm">
                      Final Selling Price
                    </p>
                    <p className="text-xl font-bold text-[#DB4444] sm:text-2xl">
                      {pricing.sellingPrice !== null
                        ? formatPrice(pricing.sellingPrice)
                        : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs text-[#7A7A7A] sm:text-sm">
                      You Save
                    </p>
                    <p className="text-lg font-semibold text-green-700 sm:text-xl">
                      {pricing.savings !== null
                        ? formatPrice(pricing.savings)
                        : "—"}
                    </p>
                  </div>
                </div>

                {Number(formData.discountPercentage) === 0 &&
                  formData.originalPrice.trim() !== "" &&
                  pricing.sellingPrice !== null && (
                    <p className="mt-3 text-xs text-[#7A7A7A]">
                      No discount applied. The selling price equals the original
                      price.
                    </p>
                  )}
              </div>
            </section>

            {/* Product image */}
            <section className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5 lg:p-6">
              <h2 className="mb-5 text-lg font-semibold text-black lg:text-xl">
                Product Image
              </h2>

              {imagePreview ? (
                <div className="relative flex h-48 w-48 items-center justify-center overflow-hidden rounded-xl bg-[#F5F5F5]">
                  <img
                    src={imagePreview}
                    alt="Product Preview"
                    className="max-h-full max-w-full object-contain p-2"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    disabled={isSubmitting}
                    aria-label="Remove image"
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E5E5E5] transition-all hover:border-[#DB4444] hover:bg-[#FFF5F5] sm:h-48">
                  <FiUpload size={30} className="mb-3 text-[#7A7A7A]" />
                  <p className="mb-1 text-sm font-medium text-black">
                    Click to upload image
                  </p>
                  <p className="text-xs text-[#7A7A7A]">
                    PNG, JPG, WEBP up to 5MB
                  </p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                </label>
              )}

              <p className="mt-3 text-xs text-[#7A7A7A]">
                The image will be uploaded to Cloudinary when you save the
                product.
              </p>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5 lg:space-y-6">
            <section className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5 lg:sticky lg:top-28 lg:p-6">
              <h2 className="mb-5 text-lg font-semibold text-black lg:text-xl">
                Publish
              </h2>

              {/*
                Rating input has been removed.
                Ratings are computed automatically from
                approved customer reviews.
              */}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting || categoriesLoading}
                  className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition-colors sm:py-4 ${
                    isSubmitting || categoriesLoading
                      ? "cursor-not-allowed bg-gray-400"
                      : "bg-[#DB4444] hover:bg-[#c73d3d]"
                  }`}
                >
                  <FiSave size={18} />
                  {isSubmitting ? "Saving Product..." : "Save Product"}
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => router.push("/admin/products")}
                  className="w-full rounded-lg border border-[#E5E5E5] px-4 py-3 text-sm font-medium text-black transition-colors hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-50 sm:py-4"
                >
                  Cancel
                </button>
              </div>

              {/* Info note */}

              <div className="mt-5 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] p-3.5">
                <p className="text-[11px] leading-5 text-[#7A7A7A] sm:text-xs">
                  <strong className="text-black">Note:</strong> Product ratings
                  are calculated automatically from approved customer reviews.
                  New products start with no rating and will display reviews
                  once customers submit and an admin approves them.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
