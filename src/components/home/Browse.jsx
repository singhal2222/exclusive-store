"use client";

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  BsArrowRight,
  BsArrowLeft,
  BsController,
  BsTablet,
} from "react-icons/bs";

import {
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

import {
  Swiper,
  SwiperSlide,
} from "swiper/react";

import "swiper/css";

// ============================================================
// SLUGIFY CATEGORY NAME
// ============================================================

const slugify = (value) => {
  return (
    value
      ?.toString()
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") || ""
  );
};

// ============================================================
// BROWSE COMPONENT
// ============================================================

const Browse = () => {
  // ============================================================
  // CATEGORIES STATE
  // ============================================================

  const [categories, setCategories] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ============================================================
  // CATEGORY ICONS
  // ============================================================

  const icons = {
    phone: FiSmartphone,
    computer: FiMonitor,
    watch: FiWatch,
    camera: FiCamera,
    headphone: FiHeadphones,
    gamepad: BsController,
    tablet: BsTablet,
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

  // ============================================================
  // SWIPER REFERENCE
  // ============================================================

  const swiperRef = useRef(null);

  // ============================================================
  // FETCH CATEGORIES
  // ============================================================

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/categories",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to fetch categories."
          );
        }

        setCategories(
          Array.isArray(data?.categories)
            ? data.categories
            : []
        );
      } catch (error) {
        console.error(
          "Fetch categories error:",
          error
        );

        setError(
          error?.message ||
            "Something went wrong while loading categories."
        );

        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // ============================================================
  // RETURN
  // ============================================================

  return (
    <div className="mb-12 w-full sm:mb-16 md:mb-20 lg:mb-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="font-poppins text-sm font-normal leading-normal tracking-normal text-black sm:text-[15px] md:text-base">
          {/* ================================================== */}
          {/* HEADER */}
          {/* ================================================== */}

          <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between md:mb-15">
            {/* Heading */}

            <div>
              <div className="mb-4 flex items-center gap-3 text-sm font-semibold text-[#DB4444] sm:mb-6 sm:gap-4 sm:text-base md:mb-9">
                <span className="h-6 w-3 rounded-md bg-[#DB4444] sm:h-7 sm:w-3.5 md:h-8 md:w-4" />

                <p>Categories</p>
              </div>

              <h2 className="text-2xl font-semibold tracking-[4%] sm:text-3xl md:text-4xl lg:text-[36px]">
                Browse By Category
              </h2>
            </div>

            {/* ================================================= */}
            {/* SWIPER BUTTONS */}
            {/* ================================================= */}

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() =>
                  swiperRef.current?.slidePrev()
                }
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#F5F5F5] transition-colors hover:bg-[#FFF5F5] hover:text-[#DB4444] sm:h-11 sm:w-11 md:h-12 md:w-12"
                aria-label="Previous categories"
              >
                <BsArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
              </button>

              <button
                type="button"
                onClick={() =>
                  swiperRef.current?.slideNext()
                }
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#F5F5F5] transition-colors hover:bg-[#FFF5F5] hover:text-[#DB4444] sm:h-11 sm:w-11 md:h-12 md:w-12"
                aria-label="Next categories"
              >
                <BsArrowRight className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>
          </div>

          {/* ================================================== */}
          {/* CATEGORIES */}
          {/* ================================================== */}

          <div className="border-b border-[#7A7A7A] pb-10 sm:pb-14 md:pb-18">
            {/* ================================================= */}
            {/* LOADING */}
            {/* ================================================= */}

            {loading && (
              <div className="flex h-32 items-center justify-center sm:h-36 md:h-42">
                <p className="text-sm text-[#7A7A7A] sm:text-[15px] md:text-base">
                  Loading categories...
                </p>
              </div>
            )}

            {/* ================================================= */}
            {/* ERROR */}
            {/* ================================================= */}

            {!loading && error && (
              <div className="flex h-32 items-center justify-center px-2 sm:h-36 md:h-42">
                <p className="text-center text-sm text-red-500 sm:text-[15px] md:text-base">
                  {error}
                </p>
              </div>
            )}

            {/* ================================================= */}
            {/* NO CATEGORIES */}
            {/* ================================================= */}

            {!loading &&
              !error &&
              categories.length === 0 && (
                <div className="flex h-32 items-center justify-center sm:h-36 md:h-42">
                  <p className="text-sm text-[#7A7A7A] sm:text-[15px] md:text-base">
                    No categories available.
                  </p>
                </div>
              )}

            {/* ================================================= */}
            {/* CATEGORY SLIDER */}
            {/* ================================================= */}

            {!loading &&
              !error &&
              categories.length > 0 && (
                <Swiper
                  onSwiper={(swiper) => {
                    swiperRef.current = swiper;
                  }}
                  slidesPerView={2}
                  spaceBetween={12}
                  slidesPerGroup={1}
                  loop={categories.length > 6}
                  breakpoints={{
                    0: {
                      slidesPerView: 2,
                      spaceBetween: 12,
                    },
                    480: {
                      slidesPerView: 2,
                      spaceBetween: 14,
                    },
                    640: {
                      slidesPerView: 3,
                      spaceBetween: 16,
                    },
                    768: {
                      slidesPerView: 4,
                      spaceBetween: 20,
                    },
                    1024: {
                      slidesPerView: 5,
                      spaceBetween: 24,
                    },
                    1280: {
                      slidesPerView: 6,
                      spaceBetween: 32,
                    },
                  }}
                >
                  {categories.map(
                    (category) => {
                      const Icon =
                        icons[
                          category?.icon
                        ] ||
                        FiSmartphone;

                      const categoryId =
                        category?._id?.toString();

                      const categorySlug =
                        slugify(
                          category?.name
                        );

                      return (
                        <SwiperSlide
                          key={categoryId}
                        >
                          <Link
                            href={`/shop?category=${categorySlug}`}
                            className="block"
                          >
                            <div className="flex h-28 flex-col items-center justify-center gap-2 rounded-md border border-[#7A7A7A] px-2 text-center transition-colors hover:border-[#DB4444] hover:bg-[#DB4444] hover:text-white sm:h-32 sm:gap-3 md:h-42 md:gap-4">
                              <Icon className="h-8 w-8 sm:h-10 sm:w-10 md:h-14 md:w-14 lg:h-16 lg:w-16" />

                              <p className="line-clamp-2 text-xs sm:text-sm md:text-base">
                                {category?.name}
                              </p>
                            </div>
                          </Link>
                        </SwiperSlide>
                      );
                    }
                  )}
                </Swiper>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Browse;