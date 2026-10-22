// FILE LOCATION: src/app/not-found.js

import Link from "next/link";

// ============================================================
// METADATA
// ============================================================

export const metadata = {
    title: "Page Not Found | Exclusive",
    description: "The page you are looking for could not be found.",
    robots: {
        index: false,
        follow: false,
    },
};

// ============================================================
// GLOBAL 404 PAGE
// ============================================================
//
// Rendered when Next.js cannot find a matching route and
// no route-group specific not-found.js applies.
//
// ============================================================

export default function GlobalNotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5] px-4 py-12 font-poppins">
            <div className="w-full max-w-xl rounded-xl border border-[#E5E5E5] bg-white p-6 text-center sm:p-10">
                {/* Big 404 */}

                <h1 className="text-[72px] font-bold leading-none text-[#DB4444] sm:text-[96px]">
                    404
                </h1>

                {/* Title */}

                <h2 className="mt-3 text-xl font-semibold text-black sm:mt-4 sm:text-2xl md:text-3xl">
                    Page Not Found
                </h2>

                {/* Description */}

                <p className="mx-auto mt-3 max-w-md text-xs leading-5 text-[#7A7A7A] sm:mt-4 sm:text-sm sm:leading-6">
                    Sorry, the page you are looking for does not exist or may have been
                    moved. Please check the URL or return to the homepage.
                </p>

                {/* Actions */}

                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row">
                    <Link
                        href="/"
                        className="inline-flex w-full items-center justify-center rounded-md bg-[#DB4444] px-6 py-2.5 text-xs font-medium text-white transition-colors hover:bg-[#C83D3D] sm:w-auto sm:py-3 sm:text-sm"
                    >
                        Go to Homepage
                    </Link>

                    <Link
                        href="/shop"
                        className="inline-flex w-full items-center justify-center rounded-md border border-[#E5E5E5] bg-white px-6 py-2.5 text-xs font-medium text-black transition-colors hover:border-[#DB4444] hover:text-[#DB4444] sm:w-auto sm:py-3 sm:text-sm"
                    >
                        Continue Shopping
                    </Link>
                </div>

                {/* Help Text */}

                <p className="mt-6 text-[10px] text-[#999999] sm:mt-8 sm:text-xs">
                    If you believe this is a mistake, please{" "}
                    <Link
                        href="/contact"
                        className="font-medium text-[#DB4444] hover:underline"
                    >
                        contact support
                    </Link>
                    .
                </p>
            </div>
        </div>
    );
}