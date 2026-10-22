"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  FiSearch,
  FiHeart,
  FiShoppingCart,
  FiMenu,
  FiUser,
  FiLogOut,
  FiX,
} from "react-icons/fi";

// ============================================================
// COUNT BADGE
// ============================================================

const Badge = ({ count }) => {
  if (!count || count < 1) return null;

  return (
    <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#DB4444] px-1 text-[10px] font-normal leading-none text-white sm:h-4.5 sm:min-w-4.5 sm:text-[11px]">
      {count > 99 ? "99+" : count}
    </span>
  );
};

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
// SEARCH RESULTS
// ============================================================

const SearchResults = ({
  query,
  loading,
  products,
  categories,
  error,
  onProductClick,
  onCategoryClick,
}) => {
  if (!query.trim()) {
    return null;
  }

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-md border border-[#E5E5E5] bg-white text-black shadow-xl">
      {/* SEARCH LOADING */}

      {loading && (
        <div className="px-4 py-5 text-center text-xs text-[#7A7A7A]">
          Searching...
        </div>
      )}

      {/* SEARCH ERROR */}

      {!loading && error && (
        <div className="px-4 py-4 text-xs text-red-500">{error}</div>
      )}

      {/* SEARCH RESULTS */}

      {!loading &&
        !error &&
        products.length === 0 &&
        categories.length === 0 && (
          <div className="px-4 py-5 text-center text-xs text-[#7A7A7A]">
            No products or categories found.
          </div>
        )}

      {/* CATEGORIES */}

      {!loading && !error && categories.length > 0 && (
        <div className="border-b border-[#E5E5E5] px-3 py-3">
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-[#7A7A7A]">
            Categories
          </p>

          <div className="space-y-1">
            {categories.map((category) => (
              <button
                key={category?._id}
                type="button"
                onClick={() => onCategoryClick(category)}
                className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-black transition-colors hover:bg-[#FFF5F5] hover:text-[#DB4444]"
              >
                {category?.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PRODUCTS */}

      {!loading && !error && products.length > 0 && (
        <div className="px-3 py-3">
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-[#7A7A7A]">
            Products
          </p>

          <div className="space-y-1">
            {products.map((product) => (
              <button
                key={product?._id}
                type="button"
                onClick={() => onProductClick(product)}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-[#FFF5F5]"
              >
                {/* Product Image */}

                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#F5F5F5]">
                  {product?.image ? (
                    <img
                      src={product.image}
                      alt={product?.name || "Product"}
                      className="max-h-full max-w-full object-contain p-1"
                    />
                  ) : (
                    <span className="text-[9px] text-[#999999]">No Image</span>
                  )}
                </div>

                {/* Product Details */}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-black">
                    {product?.name || "Product"}
                  </p>

                  <p className="mt-0.5 truncate text-[11px] text-[#7A7A7A]">
                    {product?.category?.name || "Product"}
                  </p>
                </div>

                {/* Price */}

                <span className="shrink-0 text-xs font-semibold text-[#DB4444]">
                  ₹{Number(product?.price || 0).toLocaleString("en-IN")}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// HEADER COMPONENT
// ============================================================

const Header = () => {
  // ==========================================================
  // STATES
  // ==========================================================

  const [isScrolled, setIsScrolled] = useState(false);

  const [user, setUser] = useState(null);

  const [authLoading, setAuthLoading] = useState(true);

  const [cartCount, setCartCount] = useState(0);

  const [wishlistCount, setWishlistCount] = useState(0);

  const [menuOpen, setMenuOpen] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ==========================================================
  // SEARCH STATES
  // ==========================================================

  const [searchTerm, setSearchTerm] = useState("");

  const [searchOpen, setSearchOpen] = useState(false);

  const [searchLoading, setSearchLoading] = useState(false);

  const [searchProducts, setSearchProducts] = useState([]);

  const [searchCategories, setSearchCategories] = useState([]);

  const [searchError, setSearchError] = useState("");

  const [categories, setCategories] = useState([]);

  // ==========================================================
  // REFS
  // ==========================================================

  const menuRef = useRef(null);

  const pathname = usePathname();

  const router = useRouter();

  // ==========================================================
  // SCROLL
  // ==========================================================

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // ==========================================================
  // PREVENT BODY SCROLL WHEN MOBILE MENU IS OPEN
  // ==========================================================

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // ==========================================================
  // FETCH CATEGORIES FOR HEADER SEARCH
  // ==========================================================

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Failed to fetch categories.");
        }

        setCategories(Array.isArray(data?.categories) ? data.categories : []);
      } catch (error) {
        console.error("Header categories search error:", error);

        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  // ==========================================================
  // LIVE HEADER SEARCH
  // ==========================================================

  useEffect(() => {
    const query = searchTerm.trim();

    // --------------------------------------------------------
    // CLEAR SEARCH
    // --------------------------------------------------------

    if (!query) {
      setSearchProducts([]);
      setSearchCategories([]);
      setSearchLoading(false);
      setSearchError("");

      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError("");

        // --------------------------------------------------
        // PRODUCT SEARCH
        // --------------------------------------------------

        const params = new URLSearchParams();

        params.set("search", query);

        params.set("page", "1");
        params.set("limit", "6");

        const response = await fetch(`/api/products?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Failed to search products.");
        }

        const products = Array.isArray(data?.products) ? data.products : [];

        // --------------------------------------------------
        // CATEGORY SEARCH
        // --------------------------------------------------

        const normalizedQuery = query.toLowerCase();

        const matchedCategories = categories
          .filter((category) =>
            category?.name?.toString().toLowerCase().includes(normalizedQuery),
          )
          .slice(0, 5);

        setSearchProducts(products);

        setSearchCategories(matchedCategories);
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        console.error("Header search error:", error);

        setSearchProducts([]);
        setSearchCategories([]);

        setSearchError(
          error?.message || "Something went wrong while searching.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchTerm, categories]);

  // ==========================================================
  // SEARCH INPUT CHANGE
  // ==========================================================

  const handleSearchChange = (event) => {
    const value = event.target.value;

    setSearchTerm(value);
    setSearchOpen(value.trim().length > 0);
  };

  // ==========================================================
  // SEARCH PRODUCT CLICK
  // ==========================================================

  const handleSearchProductClick = (product) => {
    const productId = product?._id?.toString();

    if (!productId) {
      return;
    }

    setSearchOpen(false);
    setSearchTerm("");
    setMobileMenuOpen(false);

    router.push(`/products/${productId}`);
  };

  // ==========================================================
  // SEARCH CATEGORY CLICK
  // ==========================================================

  const handleSearchCategoryClick = (category) => {
    const categorySlug = slugify(category?.name);

    if (!categorySlug) {
      return;
    }

    setSearchOpen(false);
    setSearchTerm("");
    setMobileMenuOpen(false);

    router.push(`/shop?category=${categorySlug}`);
  };

  // ==========================================================
  // SEARCH KEYBOARD
  // ==========================================================

  const handleSearchKeyDown = (event) => {
    // --------------------------------------------------------
    // ESCAPE
    // --------------------------------------------------------

    if (event.key === "Escape") {
      setSearchOpen(false);
      return;
    }

    // --------------------------------------------------------
    // ENTER
    // --------------------------------------------------------

    if (event.key === "Enter") {
      event.preventDefault();

      const query = searchTerm.trim();

      if (!query) {
        return;
      }

      // Exact category match
      const exactCategory = categories.find(
        (category) =>
          category?.name?.toString().trim().toLowerCase() ===
          query.toLowerCase(),
      );

      if (exactCategory) {
        handleSearchCategoryClick(exactCategory);

        return;
      }

      // Exact product match
      const exactProduct = searchProducts.find(
        (product) =>
          product?.name?.toString().trim().toLowerCase() ===
          query.toLowerCase(),
      );

      if (exactProduct) {
        handleSearchProductClick(exactProduct);

        return;
      }

      // Otherwise open the first
      // matching product, when available.
      if (searchProducts.length > 0) {
        handleSearchProductClick(searchProducts[0]);
      }
    }
  };

  // ==========================================================
  // FETCH CART + WISHLIST COUNTS
  // ==========================================================

  const fetchCounts = useCallback(async () => {
    // --------------------------------------------------------
    // CART COUNT
    // --------------------------------------------------------

    try {
      const response = await fetch("/api/cart", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();

        const items = Array.isArray(data?.cart?.items) ? data.cart.items : [];

        const totalQuantity = items.reduce(
          (total, item) => total + Number(item?.quantity || 0),
          0,
        );

        setCartCount(totalQuantity);
      } else {
        setCartCount(0);
      }
    } catch (error) {
      console.error("Header cart count error:", error);

      setCartCount(0);
    }

    // --------------------------------------------------------
    // WISHLIST COUNT
    // --------------------------------------------------------

    try {
      const response = await fetch("/api/wishlist", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();

        const items = Array.isArray(data?.wishlist?.products)
          ? data.wishlist.products
          : [];

        setWishlistCount(items.length);
      } else {
        setWishlistCount(0);
      }
    } catch (error) {
      console.error("Header wishlist count error:", error);

      setWishlistCount(0);
    }
  }, []);

  // ==========================================================
  // FETCH CURRENT USER
  // ==========================================================

  const fetchUser = useCallback(async () => {
    try {
      setAuthLoading(true);

      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      // ------------------------------------------------------
      // LOGGED OUT
      // ------------------------------------------------------

      if (!response.ok) {
        setUser(null);
        setCartCount(0);
        setWishlistCount(0);

        return;
      }

      const data = await response.json();

      // ------------------------------------------------------
      // LOGGED IN
      // ------------------------------------------------------

      if (data?.success && data?.user) {
        setUser(data.user);

        // --------------------------------------------------
        // ADMINS DO NOT HAVE CART / WISHLIST BADGES
        // --------------------------------------------------

        if (data.user.role === "admin") {
          setCartCount(0);
          setWishlistCount(0);
        } else {
          await fetchCounts();
        }
      } else {
        setUser(null);
        setCartCount(0);
        setWishlistCount(0);
      }
    } catch (error) {
      console.error("Header authentication error:", error);

      setUser(null);
      setCartCount(0);
      setWishlistCount(0);
    } finally {
      setAuthLoading(false);
    }
  }, [fetchCounts]);

  // ==========================================================
  // FETCH USER ON ROUTE CHANGE
  // ==========================================================

  useEffect(() => {
    fetchUser();

    setMenuOpen(false);
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setSearchTerm("");
  }, [pathname, fetchUser]);

  // ==========================================================
  // LIVE CART / WISHLIST / AUTH UPDATES
  // ==========================================================

  useEffect(() => {
    const refreshCounts = () => {
      if (user && user.role !== "admin") {
        fetchCounts();
      }
    };

    const refreshAuth = () => {
      fetchUser();
    };

    window.addEventListener("cart:updated", refreshCounts);

    window.addEventListener("wishlist:updated", refreshCounts);

    window.addEventListener("auth:changed", refreshAuth);

    return () => {
      window.removeEventListener("cart:updated", refreshCounts);

      window.removeEventListener("wishlist:updated", refreshCounts);

      window.removeEventListener("auth:changed", refreshAuth);
    };
  }, [user, fetchCounts, fetchUser]);

  // ==========================================================
  // CLOSE ACCOUNT MENU ON OUTSIDE CLICK
  // ==========================================================

  useEffect(() => {
    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    setUser(null);
    setCartCount(0);
    setWishlistCount(0);
    setMenuOpen(false);
    setMobileMenuOpen(false);

    window.dispatchEvent(new Event("auth:changed"));

    router.push("/auth/login");

    router.refresh();
  };

  // ==========================================================
  // NAV LINK STYLE
  // ==========================================================

  const getNavLinkClass = (path) => {
    const isActive = pathname === path;

    return `pb-1.5 border-b transition-all duration-300 ${
      isActive
        ? isScrolled
          ? "border-white"
          : "border-[#7A7A7A]"
        : "border-transparent hover:border-current"
    }`;
  };

  // ==========================================================
  // AUTH STATUS
  // ==========================================================

  const isLoggedIn = !!user;

  const isAdmin = user?.role === "admin";

  const accountHref = isAdmin ? "/admin" : "/account";

  // ==========================================================
  // AUTH ICONS
  // ==========================================================

  const AuthIcons = () => {
    // ======================================================
    // ADMIN — no cart, no wishlist, no account dropdown.
    // Just a direct link to the admin panel + logout.
    // ======================================================

    if (isAdmin) {
      return (
        <div className="flex items-center gap-3 font-bold">
          <Link
            href="/admin"
            className="rounded-md bg-[#DB4444] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#C83D3D]"
          >
            Admin Panel
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
            className="text-[#7A7A7A] transition-colors hover:text-[#DB4444]"
          >
            <FiLogOut size={22} />
          </button>
        </div>
      );
    }

    // ======================================================
    // CUSTOMER — original behavior (unchanged)
    // ======================================================

    return (
      <div className="flex items-center gap-5 font-bold">
        {/* ----------------------------------------------------
            WISHLIST
        ---------------------------------------------------- */}

        <Link
          href="/account/wishlist"
          aria-label="Wishlist"
          title="Wishlist"
          className="relative"
        >
          <FiHeart
            size={24}
            className="transition-colors duration-300 hover:text-[#DB4444]"
          />

          <Badge count={wishlistCount} />
        </Link>

        {/* ----------------------------------------------------
            CART
        ---------------------------------------------------- */}

        <Link href="/cart" aria-label="Cart" title="Cart" className="relative">
          <FiShoppingCart
            size={24}
            className="transition-colors duration-300 hover:text-[#DB4444]"
          />

          <Badge count={cartCount} />
        </Link>

        {/* ----------------------------------------------------
            ACCOUNT
        ---------------------------------------------------- */}

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label="Account"
            onClick={() => setMenuOpen((previous) => !previous)}
            className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors duration-300 ${
              menuOpen ? "bg-[#DB4444] text-white" : "hover:text-[#DB4444]"
            }`}
          >
            <FiUser size={22} />
          </button>

          {/* ACCOUNT DROPDOWN */}

          {menuOpen && (
            <div className="absolute right-0 top-11 z-50 w-56 rounded-md bg-black/90 py-2 text-sm font-normal text-white shadow-lg backdrop-blur">
              {/* User information */}

              <div className="mb-1 border-b border-white/20 px-4 pb-2">
                <p className="truncate font-medium">{user?.name}</p>

                <p className="truncate text-[12px] text-white/70">
                  {user?.email || user?.phone || ""}
                </p>
              </div>

              {/* My Account */}

              <Link
                href="/account"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2 hover:bg-white/10"
              >
                <FiUser size={16} />
                My Account
              </Link>

              {/* Logout */}

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-left hover:bg-white/10"
              >
                <FiLogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==========================================================
  // RETURN
  // ==========================================================

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full border-b pb-3 pt-4 transition-all duration-300 sm:pb-4 sm:pt-6 lg:pt-10 ${
          isScrolled
            ? "border-[#333333] bg-[#111111] text-white"
            : "border-[#7A7A7A] bg-transparent text-black"
        }`}
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="font-poppins text-sm font-medium leading-normal tracking-normal sm:text-[15px] md:text-[16px]">
            <div className="flex items-center justify-between gap-4">
              {/* ==================================================
                  LOGO
              ================================================== */}

              <div className="shrink-0">
                <Link href="/">
                  <h1 className="text-xl font-bold tracking-[3%] sm:text-2xl">
                    Exclusive
                    <span className="text-[#DB4444]">.</span>
                  </h1>
                </Link>
              </div>

              {/* ==================================================
                  DESKTOP NAVIGATION
              ================================================== */}

              <div>
                <ul className="hidden list-none items-center gap-7 lg:flex xl:gap-12">
                  <li>
                    <Link href="/" className={getNavLinkClass("/")}>
                      Home
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/contact"
                      className={getNavLinkClass("/contact")}
                    >
                      Contact
                    </Link>
                  </li>

                  <li>
                    <Link href="/about" className={getNavLinkClass("/about")}>
                      About
                    </Link>
                  </li>

                  {/* Sign Up only when logged out */}

                  {!authLoading && !isLoggedIn && (
                    <li>
                      <Link
                        href="/auth/signup"
                        className={getNavLinkClass("/auth/signup")}
                      >
                        Sign Up
                      </Link>
                    </li>
                  )}
                </ul>
              </div>

              {/* ==================================================
                  DESKTOP SEARCH + ACTIONS
              ================================================== */}

              <div className="hidden items-center gap-5 lg:flex xl:gap-7">
                {/* Search */}

                <div className="relative w-48 xl:w-60">
                  <input
                    type="text"
                    placeholder="What are you looking for?"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={() => searchTerm.trim() && setSearchOpen(true)}
                    onKeyDown={handleSearchKeyDown}
                    className={`w-full rounded-sm border-0 py-2.5 ps-3 pe-9 text-[12px] font-normal outline-0 transition-all duration-300 placeholder:text-[12px] sm:py-3 sm:ps-4 sm:pe-10 ${
                      isScrolled
                        ? "bg-[#222222] text-white placeholder:text-[#AAAAAA]"
                        : "bg-[#F5F5F5] text-black placeholder:text-[#7A7A7A]"
                    }`}
                  />

                  <button
                    type="button"
                    aria-label="Search"
                    onClick={() => setSearchOpen(true)}
                  >
                    <FiSearch
                      size={22}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer font-bold transition-colors duration-300 ${
                        isScrolled ? "text-white" : "text-black"
                      }`}
                    />
                  </button>

                  {/* Search Results */}

                  {searchOpen && searchTerm.trim() && (
                    <SearchResults
                      query={searchTerm}
                      loading={searchLoading}
                      products={searchProducts}
                      categories={searchCategories}
                      error={searchError}
                      onProductClick={handleSearchProductClick}
                      onCategoryClick={handleSearchCategoryClick}
                    />
                  )}
                </div>

                {/* Logged-in icons */}

                {!authLoading && isLoggedIn && <AuthIcons />}
              </div>

              {/* ==================================================
                  MOBILE / TABLET
              ================================================== */}

              <div className="flex items-center gap-3 sm:gap-4 lg:hidden">
                {/* ----------------------------------------------
                    ADMIN ACTIONS
                ---------------------------------------------- */}

                {!authLoading && isLoggedIn && isAdmin && (
                  <Link
                    href="/admin"
                    aria-label="Admin Panel"
                    className="rounded-md bg-[#DB4444] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#C83D3D]"
                  >
                    Admin
                  </Link>
                )}

                {/* ----------------------------------------------
                    CUSTOMER ACTIONS
                ---------------------------------------------- */}

                {!authLoading && isLoggedIn && !isAdmin && (
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Wishlist */}

                    <Link
                      href="/account/wishlist"
                      aria-label="Wishlist"
                      className="relative"
                    >
                      <FiHeart size={20} className="sm:hidden" />

                      <FiHeart size={22} className="hidden sm:block" />

                      <Badge count={wishlistCount} />
                    </Link>

                    {/* Cart */}

                    <Link href="/cart" aria-label="Cart" className="relative">
                      <FiShoppingCart size={20} className="sm:hidden" />

                      <FiShoppingCart size={22} className="hidden sm:block" />

                      <Badge count={cartCount} />
                    </Link>

                    {/* Account */}

                    <Link
                      href="/account"
                      aria-label="Account"
                      className="hidden sm:inline-flex"
                    >
                      <FiUser size={22} />
                    </Link>
                  </div>
                )}

                {/* Menu Button */}

                <button
                  type="button"
                  aria-label="Open menu"
                  onClick={() => setMobileMenuOpen((previous) => !previous)}
                  className={`cursor-pointer transition-colors duration-300 ${
                    isScrolled ? "text-white" : "text-black"
                  }`}
                >
                  {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================
          MOBILE MENU DRAWER
      ============================================================ */}

      {/* Overlay */}

      <div
        onClick={() => setMobileMenuOpen(false)}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />

      {/* Drawer */}

      <aside
        className={`fixed left-0 top-0 z-45 h-full w-64 bg-white shadow-xl transition-transform duration-300 sm:w-72 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}

        <div className="flex h-16 items-center justify-between border-b border-[#E5E5E5] px-4">
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>
            <h1 className="text-lg font-bold tracking-[3%] text-black sm:text-xl">
              Exclusive
              <span className="text-[#DB4444]">.</span>
            </h1>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            className="text-[#7A7A7A] transition-colors hover:text-[#DB4444]"
          >
            <FiX size={22} />
          </button>
        </div>

        {/* Search */}

        <div className="border-b border-[#E5E5E5] px-4 py-4">
          <div className="relative">
            <input
              type="text"
              placeholder="What are you looking for?"
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => searchTerm.trim() && setSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              className="w-full rounded-sm border-0 bg-[#F5F5F5] py-2.5 ps-3 pe-9 text-[12px] font-normal text-black outline-0 placeholder:text-[12px] placeholder:text-[#7A7A7A]"
            />

            <button
              type="button"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <FiSearch
                size={20}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-black"
              />
            </button>

            {/* Mobile Search Results */}

            {searchOpen && searchTerm.trim() && (
              <SearchResults
                query={searchTerm}
                loading={searchLoading}
                products={searchProducts}
                categories={searchCategories}
                error={searchError}
                onProductClick={handleSearchProductClick}
                onCategoryClick={handleSearchCategoryClick}
              />
            )}
          </div>
        </div>

        {/* Nav Links */}

        <nav className="py-2">
          <ul className="list-none">
            <li>
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-5 py-3 text-sm font-medium transition-colors hover:bg-[#FFF5F5] hover:text-[#DB4444] ${
                  pathname === "/"
                    ? "bg-[#FFF5F5] text-[#DB4444]"
                    : "text-black"
                }`}
              >
                Home
              </Link>
            </li>

            <li>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-5 py-3 text-sm font-medium transition-colors hover:bg-[#FFF5F5] hover:text-[#DB4444] ${
                  pathname === "/contact"
                    ? "bg-[#FFF5F5] text-[#DB4444]"
                    : "text-black"
                }`}
              >
                Contact
              </Link>
            </li>

            <li>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-5 py-3 text-sm font-medium transition-colors hover:bg-[#FFF5F5] hover:text-[#DB4444] ${
                  pathname === "/about"
                    ? "bg-[#FFF5F5] text-[#DB4444]"
                    : "text-black"
                }`}
              >
                About
              </Link>
            </li>

            {!authLoading && !isLoggedIn && (
              <li>
                <Link
                  href="/auth/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-5 py-3 text-sm font-medium transition-colors hover:bg-[#FFF5F5] hover:text-[#DB4444] ${
                    pathname === "/auth/signup"
                      ? "bg-[#FFF5F5] text-[#DB4444]"
                      : "text-black"
                  }`}
                >
                  Sign Up
                </Link>
              </li>
            )}

            {/* ==================================================
                ADMIN MOBILE LINKS
            ================================================== */}

            {!authLoading && isLoggedIn && isAdmin && (
              <>
                <li>
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-5 py-3 text-sm font-medium text-[#DB4444] transition-colors hover:bg-[#FFF5F5]"
                  >
                    Admin Panel
                  </Link>
                </li>

                <li>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full px-5 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    Logout
                  </button>
                </li>
              </>
            )}

            {/* ==================================================
                CUSTOMER MOBILE LINKS
            ================================================== */}

            {!authLoading && isLoggedIn && !isAdmin && (
              <>
                <li>
                  <Link
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-5 py-3 text-sm font-medium text-black transition-colors hover:bg-[#FFF5F5] hover:text-[#DB4444]"
                  >
                    My Account
                  </Link>
                </li>

                <li>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full px-5 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    Logout
                  </button>
                </li>
              </>
            )}

            {!authLoading && !isLoggedIn && (
              <li>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-5 py-3 text-sm font-medium text-black transition-colors hover:bg-[#FFF5F5] hover:text-[#DB4444]"
                >
                  Login
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Header;
