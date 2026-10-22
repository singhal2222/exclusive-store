// FILE LOCATION: src/app/(website)/not-found.js

import Link from "next/link";
import {
    FiHome,
    FiShoppingBag,
    FiSearch,
    FiHeart,
    FiShoppingCart,
} from "react-icons/fi";

// ============================================================
// METADATA
// ============================================================

export const metadata = {
    title: "Page Not Found | Exclusive",
    description:
        "The page you are looking for could not be found. Continue browsing our store for great products.",
    robots: {
        index: false,
        follow: false,
    },
};

// ============================================================
// STOREFRONT 404 PAGE
// ============================================================
//
// Rendered when the user lands on an unknown URL inside the
// (website) route group. Because it renders inside the
// storefront layout, the site header and footer are visible.
//
// ============================================================

export default function StorefrontNotFound() {
    // ----------------------------------------
    // Quick links to help the user recover
    // ----------------------------------------

    const quickLinks = [
        {
            name: "Home",
            path: "/",
            icon: FiHome,
            description: "Return to the homepage",
        },
        {
            name: "Shop",
            path: "/shop",
            icon: FiShoppingBag,
            description: "Browse all products",
        },
        {
            name: "Search",
            path: "/shop?focus=search",
            icon: FiSearch,
            description: "Find what you need",
        },
        {
            name: "Wishlist",
            path: "/account/wishlist",
            icon: FiHeart,
            description: "Your saved items",
        },
        {
            name: "Cart",
            path: "/cart",
            icon: FiShoppingCart,
            description: "Review your cart",
        },
    ];

    return (
        <section className="w-full bg-[#F5F5F5] px-4 py-12 font-poppins sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="mx-auto w-full max-w-7xl">
                {/* ================================================== */}
                {/* MAIN CARD */}
                {/* ================================================== */}

                <div className="mx-auto max-w-4xl rounded-2xl border border-[#E5E5E5] bg-white p-6 text-center shadow-sm sm:p-10 lg:p-12">
                    {/* Big 404 */}

                    <div className="flex flex-col items-center">
                        <h1 className="text-[80px] font-bold leading-none text-[#DB4444] sm:text-[120px] lg:text-[140px]">
                            404
                        </h1>

                        <div className="mt-2 h-1 w-16 rounded-full bg-[#DB4444] sm:mt-3 sm:w-20" />
                    </div>

                    {/* Title */}

                    <h2 className="mt-6 text-2xl font-semibold text-black sm:mt-8 sm:text-3xl md:text-4xl">
                        Page Not Found
                    </h2>

                    {/* Description */}

                    <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#7A7A7A] sm:mt-5 sm:text-base sm:leading-7">
                        The page you are looking for does not exist, has been moved, or
                        is temporarily unavailable. Please check the URL, or use one of
                        the shortcuts below to continue shopping.
                    </p>

                    {/* Primary Actions */}

                    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row">
                        <Link
                            href="/"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#DB4444] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#C83D3D] sm:w-auto sm:py-3.5 sm:text-[15px] md:px-8 md:py-4 md:text-base"
                        >
                            <FiHome size={18} />
                            Back to Homepage
                        </Link>

                        <Link
                            href="/shop"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#E5E5E5] bg-white px-6 py-3 text-sm font-medium text-black transition-colors hover:border-[#DB4444] hover:text-[#DB4444] sm:w-auto sm:py-3.5 sm:text-[15px] md:px-8 md:py-4 md:text-base"
                        >
                            <FiShoppingBag size={18} />
                            Continue Shopping
                        </Link>
                    </div>
                </div>

                {/* ================================================== */}
                {/* QUICK LINKS */}
                {/* ================================================== */}

                <div className="mx-auto mt-10 max-w-4xl sm:mt-12">
                    <div className="mb-6 text-center sm:mb-8">
                        <h3 className="text-lg font-semibold text-black sm:text-xl md:text-2xl">
                            Looking for something else?
                        </h3>

                        <p className="mt-2 text-xs text-[#7A7A7A] sm:text-sm">
                            Here are some quick links that might help.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
                        {quickLinks.map((link) => {
                            const Icon = link.icon;

                            return (
                                <Link
                                    key={link.path}
                                    href={link.path}
                                    className="group flex flex-col items-center gap-3 rounded-xl border border-[#E5E5E5] bg-white p-4 text-center transition-all hover:border-[#DB4444] hover:shadow-sm sm:p-5"
                                >
                                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF5F5] text-[#DB4444] transition-colors group-hover:bg-[#DB4444] group-hover:text-white sm:h-12 sm:w-12">
                                        <Icon size={18} />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-black sm:text-sm">
                                            {link.name}
                                        </p>

                                        <p className="mt-1 hidden text-[10px] leading-4 text-[#7A7A7A] sm:block sm:text-[11px]">
                                            {link.description}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* ================================================== */}
                {/* SUPPORT HINT */}
                {/* ================================================== */}

                <div className="mx-auto mt-10 max-w-2xl text-center sm:mt-12">
                    <p className="text-xs text-[#7A7A7A] sm:text-sm">
                        Still can&apos;t find what you&apos;re looking for?{" "}
                        <Link
                            href="/contact"
                            className="font-medium text-[#DB4444] transition-colors hover:text-[#C83D3D] hover:underline"
                        >
                            Contact our support team
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    );
}