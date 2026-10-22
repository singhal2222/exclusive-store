// FILE LOCATION: src/app/loading.js

// ============================================================
// GLOBAL LOADING PAGE
// ============================================================
//
// Shown automatically by Next.js while a page's server
// component is being rendered or while data is being fetched.
//
// This is a server component — no interactivity is needed.
//
// ============================================================

export default function GlobalLoading() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5] px-4 py-12 font-poppins">
            <div className="flex flex-col items-center justify-center gap-5 text-center sm:gap-6">
                {/* Spinner */}

                <div className="relative flex h-16 w-16 items-center justify-center sm:h-20 sm:w-20">
                    {/* Outer ring */}

                    <div className="absolute inset-0 rounded-full border-4 border-[#E5E5E5]" />

                    {/* Animated ring */}

                    <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#DB4444]" />
                </div>

                {/* Brand */}

                <div>
                    <h2 className="text-lg font-semibold tracking-[0.02em] text-black sm:text-xl md:text-2xl">
                        Exclusive
                        <span className="text-[#DB4444]">.</span>
                    </h2>

                    {/* Status text */}

                    <p className="mt-2 text-xs text-[#7A7A7A] sm:mt-3 sm:text-sm">
                        Loading, please wait...
                    </p>
                </div>
            </div>
        </div>
    );
}