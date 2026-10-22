// FILE LOCATION: src/app/(admin)/admin/coupons/page.js

import Coupons from "@/components/admin/Coupons";

// ============================================================
// PAGE METADATA
// ============================================================

export const metadata = {
    title: "Coupons | Admin | Exclusive",
    description: "Manage discount coupons and welcome offers.",
    robots: {
        index: false,
        follow: false,
    },
};

// ============================================================
// ADMIN COUPONS PAGE
// ============================================================
//
// Thin wrapper that mounts the Coupons management component
// into the admin route.
//
// All interactivity, data fetching, and validation live in
// the component itself. This page only handles the route.
//
// ============================================================

export default function AdminCouponsPage() {
    return <Coupons />;
}