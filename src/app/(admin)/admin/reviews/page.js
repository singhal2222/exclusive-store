// FILE LOCATION: src/app/(admin)/admin/reviews/page.js

import Reviews from "@/components/admin/Reviews";

// ============================================================
// PAGE METADATA
// ============================================================

export const metadata = {
    title: "Reviews | Admin | Exclusive",
    description:
        "Moderate customer reviews before they appear on the storefront.",
    robots: {
        index: false,
        follow: false,
    },
};

// ============================================================
// ADMIN REVIEWS PAGE
// ============================================================
//
// Thin wrapper that mounts the Reviews moderation component
// into the admin route.
//
// All interactivity, data fetching, and moderation logic
// live inside the component. This page handles only the
// route.
//
// ============================================================

export default function AdminReviewsPage() {
    return <Reviews />;
}