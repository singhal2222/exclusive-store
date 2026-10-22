// FILE LOCATION: src/app/(website)/account/orders/[id]/page.js

import { Suspense } from "react";
import OrderDetail from "@/components/dashboard/OrderDetail";

// ============================================================
// PAGE METADATA
// ============================================================

export const metadata = {
    title: "Order Details | Exclusive",
    description: "View detailed information about your order.",
    robots: {
        index: false,
        follow: false,
    },
};

// ============================================================
// LOADING FALLBACK
// ============================================================

function OrderDetailFallback() {
    return (
        <section className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
            <div className="mx-auto w-full max-w-7xl">
                <div className="animate-pulse">
                    <div className="mb-2 h-7 w-40 rounded bg-gray-200 sm:h-8 sm:w-48" />
                    <div className="mb-6 h-4 w-56 rounded bg-gray-200 sm:mb-8 sm:w-72" />

                    <div className="space-y-4 sm:space-y-5">
                        {[1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5 md:p-6"
                            >
                                <div className="h-5 w-36 rounded bg-gray-200 sm:w-44" />
                                <div className="mt-4 h-4 w-48 rounded bg-gray-200 sm:w-60" />
                                <div className="mt-5 h-10 w-full rounded bg-gray-200" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

// ============================================================
// PAGE
// ============================================================

export default async function OrderDetailPage({ params }) {
    const { id } = await params;

    return (
        <Suspense fallback={<OrderDetailFallback />}>
            <OrderDetail orderId={id} />
        </Suspense>
    );
}