"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BsArrowRight } from "react-icons/bs";
import { FaApple } from "react-icons/fa";
import { Swiper, SwiperSlide } from "swiper/react";
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
// HERO COMPONENT
// ============================================================

const Hero = () => {
  // ============================================================
  // STATES
  // ============================================================

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] =
    useState(true);
  const [categoriesError, setCategoriesError] =
    useState("");

  // ============================================================
  // SWIPER
  // ============================================================

  const swiperRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // ============================================================
  // HERO IMAGES
  // ============================================================

  const heroImages = [
    "/assets/hero.png",
    "/assets/hero.png",
    "/assets/hero.png",
    "/assets/hero.png",
    "/assets/hero.png",
  ];

  // ============================================================
  // FETCH CATEGORIES
  // ============================================================

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        setCategoriesError("");

        const response = await fetch("/api/categories", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Failed to fetch categories."
          );
        }

        setCategories(
          Array.isArray(data?.categories)
            ? data.categories
            : []
        );
      } catch (error) {
        console.error(
          "Hero categories fetch error:",
          error
        );

        setCategoriesError(
          error?.message ||
            "Something went wrong while loading categories."
        );

        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // ============================================================
  // RETURN
  // ============================================================

  return (
    <div className="mb-12 w-full sm:mb-16 md:mb-20 lg:mb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="font-poppins text-[14px] font-normal leading-normal tracking-normal text-black sm:text-[15px] md:text-[16px]">
          {/* ================================================== */}
          {/* MAIN GRID - responsive: stack on mobile, side-by-side on md+ */}
          {/* ================================================== */}

          <div className="flex flex-col gap-6 md:grid md:grid-cols-[minmax(0,20%)_minmax(0,80%)] md:gap-8 lg:gap-11">
            {/* ================================================== */}
            {/* CATEGORY SIDEBAR */}
            {/* ================================================== */}

            <div className="border-b border-[#7A7A7A] pb-4 md:border-b-0 md:border-r md:pb-0 md:pe-5 md:pt-12">
              {/* ================================================== */}
              {/* LOADING */}
              {/* ================================================== */}

              {categoriesLoading && (
                <ul className="flex list-none flex-row flex-wrap gap-3 md:flex-col md:gap-4">
                  {[1, 2, 3, 4, 5, 6].map(
                    (item) => (
                      <li key={item}>
                        <div className="h-4 w-20 animate-pulse rounded bg-[#F5F5F5] sm:h-5 sm:w-24 md:w-28" />
                      </li>
                    )
                  )}
                </ul>
              )}

              {/* ================================================== */}
              {/* ERROR */}
              {/* ================================================== */}

              {!categoriesLoading &&
                categoriesError && (
                  <p className="text-xs leading-5 text-red-500 sm:text-sm sm:leading-6">
                    {categoriesError}
                  </p>
                )}

              {/* ================================================== */}
              {/* NO CATEGORIES */}
              {/* ================================================== */}

              {!categoriesLoading &&
                !categoriesError &&
                categories.length === 0 && (
                  <p className="text-xs text-[#7A7A7A] sm:text-sm">
                    No categories available.
                  </p>
                )}

              {/* ================================================== */}
              {/* CATEGORIES */}
              {/* ================================================== */}

              {!categoriesLoading &&
                !categoriesError &&
                categories.length > 0 && (
                  <ul className="flex list-none flex-row flex-wrap gap-x-4 gap-y-2 md:flex-col md:gap-4">
                    {categories.map((category) => {
                      const categoryId =
                        category?._id?.toString();

                      const categorySlug = slugify(
                        category?.name
                      );

                      return (
                        <li key={categoryId}>
                          <Link
                            href={`/shop?category=${categorySlug}`}
                            className="inline-block whitespace-nowrap text-xs transition-colors hover:text-[#DB4444] sm:text-sm md:whitespace-normal md:text-base"
                          >
                            {category?.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
            </div>

            {/* ================================================== */}
            {/* HERO SLIDER */}
            {/* ================================================== */}

            <div className="relative md:pt-12">
              <Swiper
                onSwiper={(swiper) => {
                  swiperRef.current = swiper;
                }}
                onSlideChange={(swiper) => {
                  setActiveIndex(swiper.realIndex);
                }}
                slidesPerView={1}
                loop={true}
                className="w-full"
              >
                {heroImages.map(
                  (heroImage, index) => (
                    <SwiperSlide key={index}>
                      <div className="relative w-full overflow-hidden rounded-lg bg-[#000000]">
                        {/* ================================================== */}
                        {/* HERO IMAGE */}
                        {/* ================================================== */}

                        <img
                          src={heroImage}
                          className="h-auto w-full object-contain"
                          alt={`Hero ${index + 1}`}
                        />

                        {/* ================================================== */}
                        {/* HERO CONTENT - responsive positioning and sizing */}
                        {/* ================================================== */}

                        <div className="absolute left-4 top-1/2 w-[calc(100%-2rem)] max-w-[90%] -translate-y-1/2 text-white sm:left-8 sm:max-w-[80%] md:left-12 md:w-auto md:max-w-[60%] lg:left-18 lg:max-w-none">
                          <div className="mb-3 flex items-center gap-3 sm:mb-5 sm:gap-4 md:mb-6 md:gap-6">
                            <FaApple className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-15 lg:w-15" />

                            <p className="text-xs sm:text-sm md:text-base">
                              iPhone 14 Series
                            </p>
                          </div>

                          <h1 className="mb-3 text-xl font-semibold leading-tight tracking-[0.02em] sm:mb-4 sm:text-2xl sm:leading-snug md:mb-5 md:text-3xl md:leading-tight lg:mb-6 lg:text-[48px] lg:leading-16.5 lg:tracking-[0.04em]">
                            Up to 10% <br />
                            off Voucher
                          </h1>

                          <Link
                            className="inline-flex items-center gap-2 text-xs sm:gap-3 sm:text-sm md:text-base"
                            href="/shop"
                          >
                            <p className="border-b border-white pb-0.5 font-medium sm:pb-1 lg:pb-1.5">
                              Shop Now
                            </p>

                            <BsArrowRight className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                          </Link>
                        </div>
                      </div>
                    </SwiperSlide>
                  )
                )}
              </Swiper>

              {/* ================================================== */}
              {/* SLIDER DOTS - responsive sizing and spacing */}
              {/* ================================================== */}

              <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 sm:bottom-3 sm:gap-2.5 md:bottom-4 md:gap-3">
                {heroImages.map(
                  (_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        swiperRef.current?.slideToLoop(
                          index
                        );
                      }}
                      aria-label={`Go to slide ${
                        index + 1
                      }`}
                      className={`cursor-pointer rounded-full transition-all duration-300 ${
                        activeIndex === index
                          ? "h-2 w-2 border-2 border-white bg-[#DB4444] sm:h-2.5 sm:w-2.5"
                          : "h-2 w-2 bg-[#7A7A7A] sm:h-2.5 sm:w-2.5"
                      }`}
                    />
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;