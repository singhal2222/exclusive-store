// FILE LOCATION: src/components/products/ProductDetails.jsx

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiHeart,
  FiMinus,
  FiPlus,
  FiShoppingCart,
  FiTruck,
  FiStar,
  FiEdit2,
  FiTrash2,
  FiX,
  FiLoader,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi";
import { FaHeart, FaStar, FaRegStar } from "react-icons/fa";

// ============================================================
// CONSTANTS
// ============================================================

const REVIEWS_PER_PAGE = 5;

// ============================================================
// HELPERS
// ============================================================

const formatReviewDate = (date) => {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const StarRow = ({ value, size = 14 }) => (
  <span className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, index) =>
      index < value ? (
        <FaStar key={index} size={size} className="text-[#FFAD33]" />
      ) : (
        <FaRegStar key={index} size={size} className="text-gray-300" />
      ),
    )}
  </span>
);

// ============================================================
// COMPONENT
// ============================================================

export default function ProductDetails({ productId }) {
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // ==========================================================
  // REVIEWS STATE
  // ==========================================================

  const [reviews, setReviews] = useState([]);
  const [ownReview, setOwnReview] = useState(null);
  const [reviewStats, setReviewStats] = useState({
    average: 0,
    total: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [reviewPagination, setReviewPagination] = useState({
    page: 1,
    limit: REVIEWS_PER_PAGE,
    total: 0,
    totalPages: 0,
  });

  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewToEdit, setReviewToEdit] = useState(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  /* --------------------------------
     Fetch Product
  -------------------------------- */
  useEffect(() => {
    if (!productId) {
      setError("Product ID is missing.");
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/products/${productId}`, {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Product not found.");
        }

        setProduct(data.product);

        if (data.product?.image) {
          setSelectedImage(data.product.image);
        } else if (
          Array.isArray(data.product?.images) &&
          data.product.images.length > 0
        ) {
          const firstImage = data.product.images[0];

          const firstImageUrl =
            typeof firstImage === "string"
              ? firstImage
              : firstImage?.url || firstImage?.secure_url || "";

          if (firstImageUrl) {
            setSelectedImage(firstImageUrl);
          }
        }
      } catch (err) {
        console.error("Fetch product error:", err);
        setError(err.message || "Failed to load product.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  /* --------------------------------
     Check Wishlist
  -------------------------------- */
  useEffect(() => {
    if (!productId) return;

    const checkWishlist = async () => {
      try {
        const response = await fetch("/api/wishlist", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (!data.success) {
          return;
        }

        const wishlistProducts = Array.isArray(data?.wishlist?.products)
          ? data.wishlist.products
          : Array.isArray(data?.wishlist)
            ? data.wishlist
            : [];

        const exists = wishlistProducts.some((item) => {
          const wishlistProductId =
            item?.product?._id || item?.productId || item?._id;

          return String(wishlistProductId) === String(productId);
        });

        setIsWishlisted(exists);
      } catch (err) {
        console.error("Check wishlist error:", err);
      }
    };

    checkWishlist();
  }, [productId]);

  /* --------------------------------
     Check Auth State
  -------------------------------- */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        setIsLoggedIn(response.ok);
      } catch {
        setIsLoggedIn(false);
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, []);

  /* --------------------------------
     Fetch Reviews
  -------------------------------- */

  const fetchReviews = useCallback(
    async ({ page = 1, append = false } = {}) => {
      if (!productId) return;

      try {
        if (append) {
          setLoadingMoreReviews(true);
        } else {
          setReviewsLoading(true);
        }

        setReviewsError("");

        const response = await fetch(
          `/api/products/${productId}/reviews?page=${page}&limit=${REVIEWS_PER_PAGE}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data?.message || "Failed to load reviews.");
        }

        const incomingReviews = Array.isArray(data.reviews) ? data.reviews : [];

        if (append) {
          setReviews((prev) => [...prev, ...incomingReviews]);
        } else {
          setReviews(incomingReviews);
        }

        setOwnReview(data.ownReview || null);

        setReviewStats(
          data.stats || {
            average: 0,
            total: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          },
        );

        setReviewPagination(
          data.pagination || {
            page: 1,
            limit: REVIEWS_PER_PAGE,
            total: 0,
            totalPages: 0,
          },
        );
      } catch (err) {
        console.error("Fetch reviews error:", err);
        setReviewsError(err?.message || "Failed to load reviews.");
      } finally {
        setReviewsLoading(false);
        setLoadingMoreReviews(false);
      }
    },
    [productId],
  );

  useEffect(() => {
    if (!productId) return;
    fetchReviews({ page: 1, append: false });
  }, [productId, fetchReviews]);

  /* --------------------------------
     Handle "Load More"
  -------------------------------- */

  const handleLoadMore = () => {
    if (loadingMoreReviews) return;

    const nextPage = reviewPagination.page + 1;

    if (nextPage > reviewPagination.totalPages) return;

    fetchReviews({ page: nextPage, append: true });
  };

  /* --------------------------------
     Product Images
  -------------------------------- */
  const getProductImage = () => {
    if (!product) {
      return "/assets/product-placeholder.png";
    }

    if (selectedImage) {
      return selectedImage;
    }

    if (product.image) {
      return product.image;
    }

    if (Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0];

      if (typeof firstImage === "string") {
        return firstImage;
      }

      if (firstImage?.url) {
        return firstImage.url;
      }

      if (firstImage?.secure_url) {
        return firstImage.secure_url;
      }
    }

    return "/assets/product-placeholder.png";
  };

  const getImages = () => {
    if (!product) {
      return [];
    }

    const images = [];

    if (product.image) {
      images.push(product.image);
    }

    if (Array.isArray(product.images)) {
      product.images.forEach((image) => {
        const imageUrl =
          typeof image === "string"
            ? image
            : image?.url || image?.secure_url || "";

        if (imageUrl && !images.includes(imageUrl)) {
          images.push(imageUrl);
        }
      });
    }

    return images;
  };

  const productImages = getImages();

  /* --------------------------------
     Product Values
  -------------------------------- */
  const rating = Number(product?.rating || 0);

  // ------------------------------------------------------
  // NEW: use the product's own reviewCount for the header
  // summary. This keeps the header rating and count in sync
  // with the values shown on shop cards and the home page.
  // ------------------------------------------------------
  const productReviewCount = Number(product?.reviewCount || 0);

  const stock = Number(product?.stock || 0);

  const price = Number(product?.price || 0);

  const originalPrice = Number(product?.originalPrice || 0);

  const discount =
    originalPrice > price && price > 0
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  const saleBadge = product?.saleBadge?.toString().trim() || "";

  /* --------------------------------
     Quantity
  -------------------------------- */
  const increaseQuantity = () => {
    if (quantity < stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  /* --------------------------------
     Add To Cart
  -------------------------------- */
  const handleAddToCart = async () => {
    if (!product?._id || stock <= 0) {
      return;
    }

    try {
      setAddingToCart(true);

      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          productId: product._id,
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to add product to cart.");
      }

      window.dispatchEvent(new Event("cart:updated"));

      alert("Product added to cart successfully.");
    } catch (err) {
      console.error("Add to cart error:", err);

      const message = err.message?.toLowerCase() || "";

      if (
        message.includes("login") ||
        message.includes("unauthorized") ||
        message.includes("authentication")
      ) {
        router.push("/auth/login");
        return;
      }

      alert(err.message || "Failed to add product to cart.");
    } finally {
      setAddingToCart(false);
    }
  };

  /* --------------------------------
     Wishlist
  -------------------------------- */
  const handleWishlist = async () => {
    if (!product?._id || wishlistLoading) {
      return;
    }

    try {
      setWishlistLoading(true);

      /* --------------------------------
         REMOVE FROM WISHLIST
      -------------------------------- */
      if (isWishlisted) {
        const response = await fetch("/api/wishlist", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            productId: product._id,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to remove from wishlist.");
        }

        setIsWishlisted(false);

        window.dispatchEvent(new Event("wishlist:updated"));
      } else {
        /* --------------------------------
           ADD TO WISHLIST
        -------------------------------- */
        const response = await fetch("/api/wishlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            productId: product._id,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to add to wishlist.");
        }

        setIsWishlisted(true);

        window.dispatchEvent(new Event("wishlist:updated"));
      }
    } catch (err) {
      console.error("Wishlist error:", err);

      const message = err.message?.toLowerCase() || "";

      if (
        message.includes("login") ||
        message.includes("unauthorized") ||
        message.includes("authentication")
      ) {
        router.push("/auth/login");
        return;
      }

      alert(err.message || "Wishlist operation failed.");
    } finally {
      setWishlistLoading(false);
    }
  };

  /* --------------------------------
     Open Review Modal
  -------------------------------- */

  const handleOpenReviewModal = (review = null) => {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }

    setReviewToEdit(review);
    setReviewModalOpen(true);
  };

  const handleCloseReviewModal = () => {
    setReviewModalOpen(false);
    setReviewToEdit(null);
  };

  /* --------------------------------
     Loading State
  -------------------------------- */
  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 lg:px-16 xl:px-24">
          <div className="animate-pulse">
            <div className="mb-8 h-5 w-48 rounded bg-gray-200" />

            <div className="grid gap-10 lg:grid-cols-2">
              <div className="flex gap-4">
                <div className="hidden w-20 flex-col gap-4 sm:flex">
                  <div className="h-20 rounded bg-gray-200" />
                  <div className="h-20 rounded bg-gray-200" />
                  <div className="h-20 rounded bg-gray-200" />
                </div>

                <div className="h-112.5 flex-1 rounded bg-gray-200" />
              </div>

              <div>
                <div className="mb-5 h-8 w-3/4 rounded bg-gray-200" />
                <div className="mb-5 h-5 w-1/3 rounded bg-gray-200" />
                <div className="mb-8 h-10 w-1/4 rounded bg-gray-200" />

                <div className="mb-4 h-4 w-full rounded bg-gray-200" />
                <div className="mb-4 h-4 w-full rounded bg-gray-200" />
                <div className="mb-8 h-4 w-2/3 rounded bg-gray-200" />

                <div className="h-12 w-full rounded bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* --------------------------------
     Error State
  -------------------------------- */
  if (error || !product) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4 py-12 sm:px-8 lg:px-16 xl:px-24">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <FiShoppingCart size={32} className="text-gray-400" />
            </div>

            <h1 className="mb-3 text-2xl font-semibold text-gray-900">
              Product Not Found
            </h1>

            <p className="mb-7 text-gray-500">
              {error || "The product you are looking for does not exist."}
            </p>

            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-[#DB4444]"
            >
              <FiArrowLeft size={17} />
              Back to Shop
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* --------------------------------
     Compute distribution percentages
  -------------------------------- */
  const totalReviews = reviewStats.total || 0;

  const distributionPercent = (stars) => {
    if (totalReviews === 0) return 0;
    return Math.round(
      ((reviewStats.distribution?.[stars] || 0) / totalReviews) * 100,
    );
  };

  const hasMoreReviews = reviewPagination.page < reviewPagination.totalPages;

  // ------------------------------------------------------
  // Has any approved reviews (used for header stars display)
  // ------------------------------------------------------
  const hasReviews = productReviewCount > 0;

  /* --------------------------------
     Product Page
  -------------------------------- */
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:px-16 xl:px-24">
        {/* Breadcrumb */}
        <div className="mb-8 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="transition hover:text-black">
            Home
          </Link>

          <span>/</span>

          <Link href="/shop" className="transition hover:text-black">
            Shop
          </Link>

          {product.category?.name && (
            <>
              <span>/</span>

              <span>{product.category.name}</span>
            </>
          )}

          <span>/</span>

          <span className="font-medium text-gray-900">{product.name}</span>
        </div>

        {/* Product Section */}
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Images */}
          <div className="flex flex-col-reverse gap-4 sm:flex-row">
            {/* Thumbnail Images */}
            {productImages.length > 0 && (
              <div className="flex gap-3 overflow-x-auto sm:w-24 sm:flex-col sm:overflow-visible">
                {productImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded border bg-gray-50 transition ${
                      selectedImage === image
                        ? "border-black"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div className="relative flex min-h-100 flex-1 items-center justify-center overflow-hidden rounded bg-[#F5F5F5] p-6 sm:min-h-125">
              {/* Single Sale Badge */}
              {stock > 0 && (saleBadge || discount > 0) && (
                <span className="absolute left-4 top-4 z-10 bg-[#DB4444] px-3 py-1.5 text-xs font-medium text-white">
                  {saleBadge || `-${discount}%`}
                </span>
              )}

              <img
                src={getProductImage()}
                alt={product.name}
                className="h-full max-h-117.5 w-full object-contain"
              />
            </div>
          </div>

          {/* Product Information */}
          <div>
            <h1 className="text-2xl font-semibold leading-tight text-gray-900 sm:text-3xl">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {/* Stars: show empty stars when no reviews yet */}

              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, index) =>
                  hasReviews && index < Math.round(rating) ? (
                    <FaStar key={index} size={17} className="text-[#FFAD33]" />
                  ) : (
                    <FaRegStar
                      key={index}
                      size={17}
                      className="text-gray-300"
                    />
                  ),
                )}
              </div>

              {hasReviews ? (
                <>
                  <span className="text-sm text-gray-500">
                    {rating.toFixed(1)} Rating
                  </span>

                  <span className="text-gray-300">|</span>

                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("reviews-section");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-sm text-[#DB4444] hover:underline"
                  >
                    {productReviewCount}{" "}
                    {productReviewCount === 1 ? "Review" : "Reviews"}
                  </button>
                </>
              ) : (
                <span className="text-sm text-gray-500">No reviews yet</span>
              )}

              <span className="text-gray-300">|</span>

              <span
                className={`text-sm font-medium ${
                  stock > 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {stock > 0 ? `${stock} In Stock` : "Out of Stock"}
              </span>
            </div>

            {/* Price */}
            <div className="mt-6 flex items-center gap-3">
              <span className="text-3xl font-medium text-gray-900">
                ₹{price.toLocaleString("en-IN")}
              </span>

              {originalPrice > price && (
                <span className="text-lg text-gray-400 line-through">
                  ₹{originalPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mt-6 border-b border-gray-200 pb-6">
                <p className="whitespace-pre-line text-sm leading-7 text-gray-600">
                  {product.description}
                </p>
              </div>
            )}

            {/* Category */}
            {product.category?.name && (
              <div className="mt-5 flex items-center gap-3 text-sm">
                <span className="font-medium text-gray-900">Category:</span>

                <Link
                  href={
                    product.category?.slug
                      ? `/shop?category=${product.category.slug}`
                      : "/shop"
                  }
                  className="text-gray-500 transition hover:text-[#DB4444]"
                >
                  {product.category.name}
                </Link>
              </div>
            )}

            {/* Quantity + Cart */}
            <div className="mt-7 flex flex-wrap gap-3">
              {/* Quantity */}
              <div className="flex h-12 items-center rounded border border-gray-300">
                <button
                  type="button"
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                  className="flex h-full w-12 items-center justify-center border-r border-gray-300 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiMinus size={17} />
                </button>

                <span className="flex h-full min-w-14 items-center justify-center px-3 text-sm font-medium">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={increaseQuantity}
                  disabled={quantity >= stock}
                  className="flex h-full w-12 items-center justify-center border-l border-gray-300 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiPlus size={17} />
                </button>
              </div>

              {/* Add To Cart */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={stock <= 0 || addingToCart}
                className="flex h-12 flex-1 items-center justify-center gap-2 bg-[#DB4444] px-6 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300 sm:flex-none"
              >
                <FiShoppingCart size={18} />

                {addingToCart
                  ? "Adding..."
                  : stock <= 0
                    ? "Out of Stock"
                    : "Add to Cart"}
              </button>

              {/* Wishlist */}
              <button
                type="button"
                onClick={handleWishlist}
                disabled={wishlistLoading}
                aria-label={
                  isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                }
                className={`flex h-12 w-12 items-center justify-center rounded border transition ${
                  isWishlisted
                    ? "border-[#DB4444] text-[#DB4444]"
                    : "border-gray-300 hover:border-[#DB4444] hover:text-[#DB4444]"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {isWishlisted ? (
                  <FaHeart size={19} className="text-[#DB4444]" />
                ) : (
                  <FiHeart size={20} />
                )}
              </button>
            </div>

            {/* Delivery Information */}
            <div className="mt-8 overflow-hidden rounded border border-gray-300">
              {/* Delivery */}
              <div className="flex items-center gap-4 border-b border-gray-300 p-5">
                <FiTruck size={27} />

                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Free Delivery
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Free delivery on eligible orders.
                  </p>
                </div>
              </div>

              {/* Returns */}
              <div className="flex items-center gap-4 p-5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-700 text-[10px] font-semibold">
                  ↻
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Easy Returns
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Return policy applies according to product eligibility.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Product Information */}
        <div className="mt-16 border-t border-gray-200 pt-10">
          <div className="mb-7 flex items-center gap-3">
            <span className="h-8 w-1 rounded bg-[#DB4444]" />

            <h2 className="text-xl font-semibold text-gray-900">
              Product Information
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Availability */}
            <div className="rounded border border-gray-200 p-5">
              <p className="text-xs text-gray-500">Availability</p>

              <p className="mt-2 text-sm font-medium text-gray-900">
                {stock > 0 ? "In Stock" : "Out of Stock"}
              </p>
            </div>

            {/* Rating */}
            <div className="rounded border border-gray-200 p-5">
              <p className="text-xs text-gray-500">Rating</p>

              <p className="mt-2 text-sm font-medium text-gray-900">
                {hasReviews ? `${rating.toFixed(1)} / 5` : "No reviews yet"}
              </p>
            </div>

            {/* Category */}
            <div className="rounded border border-gray-200 p-5">
              <p className="text-xs text-gray-500">Category</p>

              <p className="mt-2 text-sm font-medium text-gray-900">
                {product.category?.name || "Uncategorized"}
              </p>
            </div>

            {/* Product ID */}
            <div className="rounded border border-gray-200 p-5">
              <p className="text-xs text-gray-500">Product ID</p>

              <p className="mt-2 break-all text-sm font-medium text-gray-900">
                {product._id}
              </p>
            </div>
          </div>
        </div>

        {/* ================================================== */}
        {/* CUSTOMER REVIEWS SECTION */}
        {/* ================================================== */}

        <div
          id="reviews-section"
          className="mt-16 scroll-mt-24 border-t border-gray-200 pt-10"
        >
          <div className="mb-7 flex items-center gap-3">
            <span className="h-8 w-1 rounded bg-[#DB4444]" />

            <h2 className="text-xl font-semibold text-gray-900">
              Customer Reviews
            </h2>
          </div>

          {/* Rating summary + distribution */}

          <div className="mb-10 grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-12">
            {/* Left — Summary */}

            <div className="text-center lg:text-left">
              <p className="text-5xl font-semibold text-gray-900">
                {reviewStats.average > 0
                  ? reviewStats.average.toFixed(1)
                  : "0.0"}
              </p>

              <div className="mt-2 flex justify-center lg:justify-start">
                <StarRow value={Math.round(reviewStats.average)} size={18} />
              </div>

              <p className="mt-2 text-sm text-gray-500">
                Based on {totalReviews}{" "}
                {totalReviews === 1 ? "review" : "reviews"}
              </p>

              {/* Write a review button */}

              {authChecked && (
                <button
                  type="button"
                  onClick={() => handleOpenReviewModal(ownReview)}
                  className="mt-5 inline-flex items-center gap-2 rounded border border-[#DB4444] px-5 py-2.5 text-sm font-medium text-[#DB4444] transition hover:bg-[#DB4444] hover:text-white"
                >
                  {ownReview ? (
                    <>
                      <FiEdit2 size={15} />
                      Edit Your Review
                    </>
                  ) : (
                    <>
                      <FiStar size={15} />
                      Write a Review
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Right — Distribution bars */}

            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((stars) => (
                <div key={stars} className="flex items-center gap-3">
                  <span className="flex w-12 shrink-0 items-center gap-1 text-sm text-gray-600">
                    {stars}
                    <FaStar size={12} className="text-[#FFAD33]" />
                  </span>

                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-[#FFAD33] transition-all duration-300"
                      style={{
                        width: `${distributionPercent(stars)}%`,
                      }}
                    />
                  </div>

                  <span className="w-10 shrink-0 text-right text-xs text-gray-500">
                    {reviewStats.distribution?.[stars] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* User's own review — pending / rejected notice */}

          {ownReview && ownReview.status !== "approved" && (
            <div className="mb-6 rounded border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-start gap-3">
                <FiAlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-yellow-700"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-yellow-800">
                    Your review is {ownReview.status}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-yellow-700">
                    {ownReview.status === "pending"
                      ? "It will appear publicly once an admin approves it. You can edit or delete it below."
                      : "This review was not approved. You can edit and resubmit it."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reviews list */}

          {reviewsLoading ? (
            <div className="rounded border border-gray-200 p-8 text-center">
              <FiLoader
                size={22}
                className="mx-auto animate-spin text-gray-400"
              />
              <p className="mt-3 text-sm text-gray-500">Loading reviews...</p>
            </div>
          ) : reviewsError ? (
            <div className="rounded border border-red-200 bg-red-50 p-5 text-center">
              <p className="text-sm text-red-600">{reviewsError}</p>
              <button
                type="button"
                onClick={() => fetchReviews({ page: 1, append: false })}
                className="mt-3 rounded bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded border border-gray-200 p-8 text-center">
              <FaRegStar size={32} className="mx-auto mb-3 text-gray-300" />

              <p className="text-sm font-medium text-gray-900">
                No reviews yet
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Be the first to review this product.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {reviews.map((review) => (
                <div
                  key={review._id}
                  className="rounded border border-gray-200 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DB4444] text-sm font-semibold text-white">
                        {review.user?.name?.charAt(0)?.toUpperCase() || "A"}
                      </div>

                      {/* Name + rating */}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">
                            {review.user?.name || "Anonymous"}
                          </p>

                          {review.verifiedPurchase && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                              <FiCheck size={10} />
                              Verified Purchase
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-2">
                          <StarRow value={review.rating} size={13} />
                          <span className="text-xs text-gray-500">
                            {formatReviewDate(review.createdAt)}
                            {review.editedAt && " (edited)"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Owner actions */}

                    {review.isOwnReview && (
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenReviewModal(review)}
                          className="flex h-8 w-8 items-center justify-center rounded border border-gray-200 text-gray-600 transition hover:border-[#DB4444] hover:text-[#DB4444]"
                          aria-label="Edit review"
                        >
                          <FiEdit2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {review.title && (
                    <h3 className="mt-4 text-sm font-medium text-gray-900">
                      {review.title}
                    </h3>
                  )}

                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">
                    {review.comment}
                  </p>
                </div>
              ))}

              {/* Load more */}

              {hasMoreReviews && (
                <div className="pt-4 text-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMoreReviews}
                    className="inline-flex items-center gap-2 rounded border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:border-[#DB4444] hover:text-[#DB4444] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingMoreReviews ? (
                      <>
                        <FiLoader size={15} className="animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load More Reviews"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================================================== */}
      {/* REVIEW MODAL */}
      {/* ================================================== */}

      {reviewModalOpen && (
        <ReviewModal
          productId={productId}
          existingReview={reviewToEdit}
          onClose={handleCloseReviewModal}
          onSuccess={() => {
            handleCloseReviewModal();
            fetchReviews({ page: 1, append: false });
          }}
        />
      )}
    </main>
  );
}

// ============================================================
// REVIEW MODAL COMPONENT
// ============================================================

function ReviewModal({ productId, existingReview, onClose, onSuccess }) {
  const isEditing = Boolean(existingReview?._id);

  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState(existingReview?.title || "");
  const [comment, setComment] = useState(existingReview?.comment || "");

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ----------------------------------------
  // Submit
  // ----------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting || deleting) return;

    setError("");
    setSuccess("");

    // Validate
    if (!rating || rating < 1 || rating > 5) {
      setError("Please select a rating between 1 and 5.");
      return;
    }

    if (!comment.trim() || comment.trim().length < 5) {
      setError("Please write at least 5 characters.");
      return;
    }

    if (comment.trim().length > 1000) {
      setError("Comment must not exceed 1000 characters.");
      return;
    }

    if (title.trim().length > 100) {
      setError("Title must not exceed 100 characters.");
      return;
    }

    try {
      setSubmitting(true);

      const url = isEditing
        ? `/api/products/${productId}/reviews/${existingReview._id}`
        : `/api/products/${productId}/reviews`;

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          rating,
          title: title.trim(),
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.message || "Failed to save review.");
      }

      setSuccess(
        data.message ||
          (isEditing
            ? "Review updated. It will reappear once approved."
            : "Review submitted. It will appear once approved."),
      );

      setTimeout(() => {
        onSuccess();
      }, 900);
    } catch (err) {
      console.error("Submit review error:", err);
      setError(err?.message || "Failed to save review.");
    } finally {
      setSubmitting(false);
    }
  };

  // ----------------------------------------
  // Delete own review
  // ----------------------------------------

  const handleDelete = async () => {
    if (!isEditing || submitting || deleting) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete your review? This cannot be undone.",
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/products/${productId}/reviews/${existingReview._id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.message || "Failed to delete review.");
      }

      setSuccess("Review deleted.");

      setTimeout(() => {
        onSuccess();
      }, 700);
    } catch (err) {
      console.error("Delete review error:", err);
      setError(err?.message || "Failed to delete review.");
    } finally {
      setDeleting(false);
    }
  };

  // ----------------------------------------
  // Render
  // ----------------------------------------

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting && !deleting) {
          onClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded border border-gray-200 bg-white p-6">
        {/* Header */}

        <div className="mb-5 flex items-start justify-between gap-3 border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditing ? "Edit Your Review" : "Write a Review"}
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Your review will be visible once approved.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting || deleting}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-black disabled:opacity-40"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Rating */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900">
              Rating <span className="text-[#DB4444]">*</span>
            </label>

            <div
              className="flex items-center gap-1"
              onMouseLeave={() => setHoveredRating(0)}
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= (hoveredRating || rating);

                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    disabled={submitting || deleting}
                    className="transition-transform hover:scale-110 disabled:cursor-not-allowed"
                    aria-label={`${star} star${star === 1 ? "" : "s"}`}
                  >
                    {active ? (
                      <FaStar size={26} className="text-[#FFAD33]" />
                    ) : (
                      <FaRegStar size={26} className="text-gray-300" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900">
              Title{" "}
              <span className="text-xs font-normal text-gray-500">
                (optional)
              </span>
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="Summarize your experience"
              disabled={submitting || deleting}
              className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#DB4444] disabled:opacity-60"
            />

            <p className="mt-1 text-right text-[10px] text-gray-400">
              {title.length}/100
            </p>
          </div>

          {/* Comment */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900">
              Review <span className="text-[#DB4444]">*</span>
            </label>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              minLength={5}
              maxLength={1000}
              placeholder="Share your thoughts about this product..."
              disabled={submitting || deleting}
              className="w-full resize-none rounded border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#DB4444] disabled:opacity-60"
            />

            <p className="mt-1 text-right text-[10px] text-gray-400">
              {comment.length}/1000
            </p>
          </div>

          {/* Error / Success */}

          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded border border-green-200 bg-green-50 px-3 py-2.5 text-xs text-green-700">
              {success}
            </div>
          )}

          {/* Actions */}

          <div className="flex flex-col-reverse gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end sm:gap-3">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting || deleting}
                className="inline-flex w-full items-center justify-center gap-2 rounded border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-60 sm:mr-auto sm:w-auto"
              >
                {deleting ? (
                  <>
                    <FiLoader size={14} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 size={14} />
                    Delete Review
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={submitting || deleting}
              className="w-full rounded border border-gray-300 px-4 py-2.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-60 sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || deleting || !rating}
              className="inline-flex w-full items-center justify-center gap-2 rounded bg-[#DB4444] px-5 py-2.5 text-xs font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {submitting ? (
                <>
                  <FiLoader size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FiCheck size={14} />
                  {isEditing ? "Update Review" : "Submit Review"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
