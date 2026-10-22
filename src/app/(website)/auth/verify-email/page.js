// FILE LOCATION: src/app/(website)/auth/verify-email/page.js

import { Suspense } from "react";
import VerifyEmail from "@/components/auth/VerifyEmail";

// ============================================================
// PAGE METADATA
// ============================================================

export const metadata = {
    title: "Verify Email | Exclusive",
    description:
        "Verify your Exclusive account email address to activate your account.",
    robots: {
        index: false,
        follow: false,
    },
};

// ============================================================
// LOADING FALLBACK
// ============================================================
//
// Shown while the client component reads the search params.
// Matches the visual style of the actual verification page
// so the transition is seamless.
//
// ============================================================

function VerifyEmailFallback() {
    return (
        <div className="mb-12 mt-8 w-full sm:mb-16 sm:mt-12 md:mb-20 md:mt-16 lg:mb-24 lg:mt-20">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 xl:pe-30">
                <div className="font-poppins text-sm font-normal leading-normal tracking-normal text-black sm:text-[15px] md:text-base">
                    <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-[60fr_40fr] lg:gap-16 xl:gap-36">
                        {/* LEFT - IMAGE */}

                        <div className="w-full">
                            <img
                                src="/assets/login.png"
                                className="mx-auto h-auto w-full max-w-md object-contain lg:mx-0 lg:max-w-none"
                                alt="Verify email"
                            />
                        </div>

                        {/* RIGHT - LOADING STATE */}

                        <div className="w-full">
                            <div className="mb-8 flex justify-center sm:mb-10">
                                <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#F5F5F5] border-t-[#DB4444] sm:h-16 sm:w-16" />
                            </div>

                            <h2 className="mb-4 text-center text-2xl font-medium tracking-[4%] sm:mb-5 sm:text-3xl md:mb-6 lg:text-[36px]">
                                Loading...
                            </h2>

                            <p className="text-center text-sm leading-6 text-[#7A7A7A] sm:text-[15px] md:text-base">
                                Preparing to verify your email address.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// PAGE
// ============================================================

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<VerifyEmailFallback />}>
            <VerifyEmail />
        </Suspense>
    );
}