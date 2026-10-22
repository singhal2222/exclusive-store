// FILE LOCATION: src/app/(website)/loading.js

// ============================================================
// STOREFRONT LOADING PAGE
// ============================================================
//
// Shown by Next.js during route transitions inside the
// (website) group. Because it renders inside the storefront
// layout, the site header and footer remain visible.
//
// This is a server component — no interactivity is needed.
//
// ============================================================

export default function StorefrontLoading() {
    return (
        <section className="w-full bg-[#F5F5F5] px-4 py-10 font-poppins sm:px-6 sm:py-14 lg:px-8 lg:py-16">
            <div className="mx-auto w-full max-w-7xl">
                {/* ================================================== */}
                {/* CENTERED LOADING */}
                {/* ================================================== */}

                <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center sm:gap-8">
                    {/* Spinner */}

                    <div className="relative flex h-16 w-16 items-center justify-center sm:h-20 sm:w-20">
                        {/* Static track */}

                        <div className="absolute inset-0 rounded-full border-4 border-[#E5E5E5]" />

                        {/* Animated ring */}

                        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#DB4444] border-r-[#DB4444]" />
                    </div>

                    {/* Brand */}

                    <div>
                        <h2 className="text-lg font-semibold tracking-[0.02em] text-black sm:text-xl md:text-2xl">
                            Exclusive
                            <span className="text-[#DB4444]">.</span>
                        </h2>

                        {/* Status */}

                        <p className="mt-2 text-xs text-[#7A7A7A] sm:mt-3 sm:text-sm">
                            Loading content, please wait...
                        </p>
                    </div>

                    {/* Skeleton hint (subtle) */}

                    <div className="mt-2 flex w-full max-w-md flex-col items-center gap-3 sm:mt-4">
                        <div className="h-2.5 w-3/4 animate-pulse rounded-full bg-[#E5E5E5]" />
                        <div className="h-2.5 w-1/2 animate-pulse rounded-full bg-[#E5E5E5]" />
                    </div>
                </div>
            </div>
        </section>
    );
}