// FILE LOCATION: src/app/(website)/shipping-policy/page.js

import LegalPageLayout from "@/components/legal/LegalPageLayout";

// ============================================================
// PAGE METADATA
// ============================================================

export const metadata = {
    title: "Shipping Policy | Exclusive",
    description:
        "Learn about Exclusive's shipping coverage, delivery timelines, charges, order tracking, and how we handle delivery issues across India.",
    robots: {
        index: true,
        follow: true,
    },
    alternates: {
        canonical: "/shipping-policy",
    },
};

// ============================================================
// LEGAL CONTENT
// ============================================================

const LAST_UPDATED = "October 13, 2026";

const CONTACT = {
    email: "ysinghal157@gmail.com",
    phone: "+91-9389602911",
    address:
        "Devout Tech Consultants, 6th Floor, Vista Tower, Phase-8A, Sector-75, Mohali, Punjab, India",
};

// ============================================================
// SECTIONS
// ============================================================

const sections = [
    {
        id: "introduction",
        title: "1. Introduction",
        content: (
            <>
                <p>
                    At <strong>Exclusive</strong>, we are committed to delivering your
                    orders safely, quickly, and reliably. This Shipping Policy
                    outlines our shipping coverage, processing times, delivery
                    timelines, charges, and how we handle delivery-related issues.
                </p>

                <p>
                    By placing an order on our website, you agree to the terms
                    described in this policy. We encourage you to read it carefully
                    before making a purchase.
                </p>
            </>
        ),
    },

    {
        id: "coverage",
        title: "2. Shipping Coverage",
        content: (
            <>
                <p>
                    We currently ship to <strong>most serviceable pin codes across
                        India</strong>. Our delivery partners include leading courier
                    companies and India Post to ensure wide coverage.
                </p>

                <p>
                    <strong>Serviceable Locations:</strong> Whether your address is
                    serviceable can be checked at checkout. If your pin code is not
                    serviceable, you will be notified before completing your order.
                </p>

                <p>
                    <strong>International Shipping:</strong> We currently do{" "}
                    <strong>not</strong> offer international shipping. We plan to
                    expand to select international destinations in the future.
                </p>
            </>
        ),
    },

    {
        id: "processing",
        title: "3. Order Processing Time",
        content: (
            <>
                <p>
                    Once your order is placed and payment is confirmed (for prepaid
                    orders) or verified (for COD orders), it will be processed and
                    dispatched within:
                </p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>
                        <strong>1–2 working days</strong> for standard orders.
                    </li>
                    <li>
                        <strong>2–4 working days</strong> for orders placed during peak
                        seasons, sales, or festivals.
                    </li>
                </ul>

                <p>
                    <strong>Note:</strong> Working days are Monday to Saturday,
                    excluding Sundays and public holidays. Orders placed on Sundays or
                    public holidays will begin processing on the next working day.
                </p>
            </>
        ),
    },

    {
        id: "charges",
        title: "4. Shipping Charges",
        content: (
            <>
                <p>
                    Shipping charges are calculated based on the delivery address,
                    order weight, and shipping method. The exact shipping charge will
                    be displayed at checkout before you make the payment.
                </p>

                <p>
                    <strong>Free Shipping:</strong> We offer{" "}
                    <strong>free shipping on all prepaid orders above ₹499</strong>.
                    Orders below this amount will incur a nominal shipping fee.
                </p>

                <p>
                    <strong>Cash on Delivery (COD):</strong> COD orders may include an
                    additional COD handling fee, which will be shown at checkout.
                </p>

                <p>
                    <strong>Non-Refundable Charges:</strong> Shipping charges and COD
                    fees are non-refundable unless the return or cancellation is due
                    to our error.
                </p>
            </>
        ),
    },

    {
        id: "delivery-timelines",
        title: "5. Estimated Delivery Timelines",
        content: (
            <>
                <p>
                    Once your order is dispatched, it will be delivered within the
                    following estimated timeframes:
                </p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>
                        <strong>Metro Cities (Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad, Pune):</strong>{" "}
                        2–4 working days
                    </li>
                    <li>
                        <strong>Tier 2 &amp; Tier 3 Cities:</strong> 3–6 working days
                    </li>
                    <li>
                        <strong>Remote &amp; Rural Areas:</strong> 5–8 working days
                    </li>
                </ul>

                <p>
                    These timelines are estimates and may vary due to factors beyond
                    our control, including weather conditions, courier delays, public
                    holidays, and unforeseen events such as strikes or natural
                    disasters.
                </p>
            </>
        ),
    },

    {
        id: "tracking",
        title: "6. Order Tracking",
        content: (
            <>
                <p>
                    Once your order is shipped, you will receive a{" "}
                    <strong>tracking number</strong> and a{" "}
                    <strong>tracking link</strong> via email and SMS.
                </p>

                <p>You can also track your order anytime by:</p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>
                        Logging in to your account and going to{" "}
                        <strong>Account → Orders</strong>
                    </li>
                    <li>Clicking the tracking link in your shipping confirmation</li>
                    <li>
                        Visiting our{" "}
                        <a
                            href="/account/orders"
                            className="font-medium text-[#DB4444] hover:underline"
                        >
                            Order Details
                        </a>{" "}
                        page for real-time status updates
                    </li>
                </ul>

                <p>
                    If you do not receive tracking details within 3 working days of
                    order confirmation, please contact us.
                </p>
            </>
        ),
    },

    {
        id: "delivery-attempts",
        title: "7. Delivery Attempts and Failed Deliveries",
        content: (
            <>
                <p>
                    Our courier partners will typically make{" "}
                    <strong>up to 3 delivery attempts</strong> at your shipping
                    address on different days. Please ensure someone is available at
                    the delivery address to receive the package.
                </p>

                <p>
                    <strong>If all attempts fail:</strong> The shipment will be
                    returned to us (RTO — Return to Origin). We will contact you to
                    arrange:
                </p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>
                        Re-delivery (additional shipping charges may apply), or
                    </li>
                    <li>
                        Refund (with forward and return shipping charges deducted, unless
                        the failure was due to our error)
                    </li>
                </ul>

                <p>
                    Please ensure your contact number and delivery address are correct
                    at the time of placing the order.
                </p>
            </>
        ),
    },

    {
        id: "delivery-address",
        title: "8. Delivery Address",
        content: (
            <>
                <p>
                    Please provide a complete and accurate delivery address, including
                    the house number, street, area, landmark (if applicable), city,
                    state, and pin code. Incorrect or incomplete addresses can cause
                    delays or failed deliveries.
                </p>

                <p>
                    <strong>Changes to Address:</strong> Address changes are only
                    possible before the order is shipped. Once shipped, the address
                    cannot be changed. Please contact us as soon as possible if you
                    need to update your delivery address.
                </p>

                <p>
                    <strong>Address Availability:</strong> Our courier partners may
                    not deliver to all areas. If your address is not serviceable by
                    our partners, we will notify you and either ship via an alternate
                    method or cancel your order with a full refund.
                </p>
            </>
        ),
    },

    {
        id: "damaged-lost",
        title: "9. Damaged or Lost Shipments",
        content: (
            <>
                <p>
                    While we take every precaution to ensure your order arrives
                    safely, occasionally shipments may be damaged in transit or lost
                    by the courier.
                </p>

                <p>
                    <strong>Damaged on Arrival:</strong> If your package arrives
                    visibly damaged, please refuse delivery (if possible) or contact
                    us within <strong>48 hours</strong> of delivery with:
                </p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>Clear photographs of the damaged package and product</li>
                    <li>Your order number</li>
                    <li>A short description of the damage</li>
                </ul>

                <p>
                    <strong>Lost in Transit:</strong> If a shipment is confirmed lost
                    in transit by the courier, we will either arrange a replacement
                    or issue a full refund, at no cost to you.
                </p>
            </>
        ),
    },

    {
        id: "restrictions",
        title: "10. Shipping Restrictions",
        content: (
            <>
                <p>
                    Due to legal and logistical reasons, the following may be subject
                    to additional restrictions:
                </p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>
                        <strong>Remote Locations:</strong> Certain remote areas may not
                        be serviceable by all courier partners.
                    </li>
                    <li>
                        <strong>Restricted Items:</strong> Products regulated by local
                        laws (e.g., certain chemicals, liquids, or batteries) may not
                        be shippable to all pin codes.
                    </li>
                    <li>
                        <strong>Large or Bulky Items:</strong> Some products may incur
                        additional shipping charges based on weight and dimensions.
                    </li>
                    <li>
                        <strong>Restricted Pin Codes:</strong> We reserve the right to
                        refuse shipping to specific pin codes for operational reasons.
                    </li>
                </ul>

                <p>
                    If your order cannot be shipped for any of these reasons, we will
                    notify you immediately and issue a full refund.
                </p>
            </>
        ),
    },

    {
        id: "contact",
        title: "11. Contact Us",
        content: (
            <>
                <p>
                    If you have any questions about our shipping process, or need
                    assistance with an existing order, please reach out to us:
                </p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>
                        <strong>Email:</strong> {CONTACT.email}
                    </li>
                    <li>
                        <strong>Phone:</strong> {CONTACT.phone}
                    </li>
                    <li>
                        <strong>Address:</strong> {CONTACT.address}
                    </li>
                </ul>

                <p>
                    Our support team is available{" "}
                    <strong>Monday to Saturday, 10:00 AM to 6:00 PM IST</strong>. We
                    aim to respond to all queries within 1 working day.
                </p>
            </>
        ),
    },
];

// ============================================================
// PAGE COMPONENT
// ============================================================

export default function ShippingPolicyPage() {
    return (
        <LegalPageLayout
            title="Shipping Policy"
            subtitle="How Exclusive ships your orders across India — including processing times, delivery timelines, tracking, and charges."
            lastUpdated={LAST_UPDATED}
            sections={sections}
            currentPath="/shipping-policy"
            contact={CONTACT}
        />
    );
}