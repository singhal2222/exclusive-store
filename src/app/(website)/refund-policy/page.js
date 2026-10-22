// FILE LOCATION: src/app/(website)/refund-policy/page.js

import LegalPageLayout from "@/components/legal/LegalPageLayout";

// ============================================================
// PAGE METADATA
// ============================================================

export const metadata = {
    title: "Refund & Return Policy | Exclusive",
    description:
        "Understand how cancellations, returns, replacements, and refunds work at Exclusive, including eligibility criteria and timelines.",
    robots: {
        index: true,
        follow: true,
    },
    alternates: {
        canonical: "/refund-policy",
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
                    At <strong>Exclusive</strong>, customer satisfaction is our top
                    priority. This Refund &amp; Return Policy explains how order
                    cancellations, returns, replacements, and refunds are handled.
                </p>

                <p>
                    By placing an order on our website, you agree to the terms
                    described in this policy. We encourage you to read it carefully
                    before making a purchase.
                </p>

                <p>
                    This policy is published in accordance with the{" "}
                    <strong>Consumer Protection Act, 2019</strong> and the{" "}
                    <strong>
                        Consumer Protection (E-Commerce) Rules, 2020
                    </strong>
                    , which govern online purchases made within India.
                </p>
            </>
        ),
    },

    {
        id: "cancellations",
        title: "2. Order Cancellations",
        content: (
            <>
                <p>
                    <strong>Before Shipping:</strong> You may cancel your order free
                    of charge at any time before it has been shipped. To cancel,
                    please use the cancel option in your{" "}
                    <strong>Account → Orders</strong> page, or contact us using the
                    details at the end of this page.
                </p>

                <p>
                    <strong>After Shipping:</strong> Once an order has been shipped,
                    it cannot be cancelled. However, you may be eligible for a return
                    or replacement after delivery, as per the eligibility criteria
                    below.
                </p>

                <p>
                    <strong>Cancellation by Us:</strong> We reserve the right to
                    cancel an order in cases of product unavailability, pricing
                    errors, fraudulent activity, or non-serviceable delivery
                    addresses. In such cases, a full refund will be issued
                    automatically.
                </p>
            </>
        ),
    },

    {
        id: "return-eligibility",
        title: "3. Return Eligibility",
        content: (
            <>
                <p>
                    To be eligible for a return, the following conditions must be met:
                </p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>
                        The return request must be raised within{" "}
                        <strong>7 days</strong> from the date of delivery.
                    </li>
                    <li>
                        The product must be unused, undamaged, and in its original
                        condition.
                    </li>
                    <li>
                        The product must be returned with all original tags, labels,
                        packaging, accessories, manuals, and free gifts (if any).
                    </li>
                    <li>
                        The product must not fall under the list of non-returnable items
                        (see the next section).
                    </li>
                    <li>
                        Proof of purchase (order number or invoice) must be provided.
                    </li>
                </ul>

                <p>
                    Returns that do not meet these conditions may be rejected or
                    subject to a partial refund at our discretion.
                </p>
            </>
        ),
    },

    {
        id: "non-returnable",
        title: "4. Non-Returnable Items",
        content: (
            <>
                <p>
                    For hygiene, safety, and regulatory reasons, the following items
                    are <strong>not eligible for return or refund</strong>:
                </p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>
                        Personal care, beauty, and skincare products that have been
                        opened or used.
                    </li>
                    <li>
                        Innerwear, swimwear, and intimate apparel.
                    </li>
                    <li>
                        Perishable goods such as food, beverages, and pet food (unless
                        damaged on arrival).
                    </li>
                    <li>
                        Digital products, gift cards, and downloadable software.
                    </li>
                    <li>
                        Customised or personalised items made to order.
                    </li>
                    <li>
                        Products marked as &quot;Final Sale&quot; or
                        &quot;Non-Returnable&quot; on the product page.
                    </li>
                </ul>

                <p>
                    If a non-returnable product arrives damaged or defective, please
                    refer to Section 8 of this policy.
                </p>
            </>
        ),
    },

    {
        id: "return-process",
        title: "5. Return Process",
        content: (
            <>
                <p>To initiate a return, please follow these steps:</p>

                <ol className="ml-5 list-decimal space-y-1.5">
                    <li>
                        Log in to your account and go to{" "}
                        <strong>Account → Orders</strong>.
                    </li>
                    <li>
                        Select the order and the product(s) you wish to return.
                    </li>
                    <li>
                        Submit a return request with a brief reason and, if applicable,
                        photos of the product.
                    </li>
                    <li>
                        Our team will review your request and respond within{" "}
                        <strong>2 working days</strong>.
                    </li>
                    <li>
                        If approved, we will arrange a pickup from your delivery address
                        or provide you with a return shipping address.
                    </li>
                    <li>
                        Once we receive the returned product and verify its condition,
                        we will process your refund or replacement.
                    </li>
                </ol>

                <p>
                    Please ensure the product is securely packed to prevent damage
                    during transit.
                </p>
            </>
        ),
    },

    {
        id: "refund-eligibility",
        title: "6. Refund Eligibility",
        content: (
            <>
                <p>Refunds will be issued in the following cases:</p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>
                        The order was cancelled before shipping by you or by us.
                    </li>
                    <li>
                        The product was returned in acceptable condition within the
                        return window.
                    </li>
                    <li>
                        The product arrived damaged, defective, or different from what
                        was ordered.
                    </li>
                    <li>
                        The product was lost in transit or never delivered.
                    </li>
                    <li>
                        Delivery failed due to our error or courier issues.
                    </li>
                </ul>

                <p>
                    Refunds may be <strong>partial</strong> if the returned product
                    shows signs of use, damage caused by the customer, missing
                    accessories, or missing original packaging.
                </p>

                <p>
                    Shipping charges, COD charges, and any convenience fees may be
                    non-refundable unless the return is due to our error.
                </p>
            </>
        ),
    },

    {
        id: "refund-methods",
        title: "7. Refund Methods and Timelines",
        content: (
            <>
                <p>
                    Once your refund is approved, the amount will be credited back
                    using the original payment method, or as store credit, based on
                    your choice where applicable.
                </p>

                <p>
                    <strong>Refund timelines:</strong>
                </p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>
                        <strong>Online Payments (Razorpay, UPI, Cards, Net Banking):</strong>{" "}
                        Refunds are processed within 2 working days of approval and
                        typically reflect in your account within{" "}
                        <strong>5–7 working days</strong>, depending on your bank or
                        payment provider.
                    </li>
                    <li>
                        <strong>Cash on Delivery (COD):</strong> Refunds for COD orders
                        are processed via bank transfer (NEFT/IMPS) to the bank account
                        details you provide. Alternatively, we may issue store credit
                        if you prefer.
                    </li>
                    <li>
                        <strong>Store Credit:</strong> Where applicable, store credit
                        is issued instantly upon approval and can be used on future
                        purchases.
                    </li>
                </ul>

                <p>
                    Refund timelines are indicative and may vary during peak seasons,
                    holidays, or due to bank processing delays.
                </p>
            </>
        ),
    },

    {
        id: "damaged-defective",
        title: "8. Damaged, Defective, or Wrong Products",
        content: (
            <>
                <p>
                    If you receive a product that is damaged, defective, or different
                    from what you ordered, please contact us within{" "}
                    <strong>48 hours</strong> of delivery.
                </p>

                <p>To help us resolve the issue quickly, please provide:</p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>Your order number</li>
                    <li>Clear photographs of the product and packaging</li>
                    <li>A short video (if possible) showing the issue</li>
                    <li>A brief description of the problem</li>
                </ul>

                <p>
                    Once verified, we will arrange a free pickup or replacement at no
                    additional cost to you. If a replacement is not available, a full
                    refund will be issued.
                </p>
            </>
        ),
    },

    {
        id: "replacement",
        title: "9. Replacement Policy",
        content: (
            <>
                <p>
                    Replacements are offered for products that are damaged, defective,
                    or incorrect, subject to availability of the same product.
                </p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>
                        Replacement requests must be raised within{" "}
                        <strong>7 days</strong> from the date of delivery.
                    </li>
                    <li>
                        The replacement product will be shipped once we receive and
                        verify the original product.
                    </li>
                    <li>
                        If the replacement product is unavailable, we will issue a full
                        refund instead.
                    </li>
                </ul>

                <p>
                    For size or colour exchanges (where offered), please contact us
                    and we will guide you through the process.
                </p>
            </>
        ),
    },

    {
        id: "failed-delivery",
        title: "10. Failed Deliveries and RTO",
        content: (
            <>
                <p>
                    If a delivery attempt fails because you are unavailable, the
                    address is incorrect, or the pin code is unreachable, the shipment
                    may be returned to us (RTO — Return to Origin).
                </p>

                <p>In such cases:</p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>
                        Once we receive the returned shipment, we will contact you to
                        arrange re-delivery (additional shipping charges may apply) or
                        process a refund.
                    </li>
                    <li>
                        Refunds for RTO orders are processed after deducting forward and
                        return shipping charges, unless the failure was due to our
                        error.
                    </li>
                    <li>
                        For prepaid orders, the amount will be refunded to the original
                        payment method.
                    </li>
                </ul>
            </>
        ),
    },

    {
        id: "dispute-resolution",
        title: "11. Dispute Resolution",
        content: (
            <>
                <p>
                    We are committed to resolving any disputes fairly and promptly. If
                    you are not satisfied with our handling of a refund or return,
                    please contact us first using the details at the end of this page.
                </p>

                <p>
                    If a resolution cannot be reached, disputes will be handled in
                    accordance with the{" "}
                    <strong>Consumer Protection Act, 2019</strong> and subject to the
                    jurisdiction of the courts located in{" "}
                    <strong>Mohali, Punjab, India</strong>.
                </p>

                <p>
                    We encourage you to keep all communication records (email, chat,
                    screenshots) related to your order for reference.
                </p>
            </>
        ),
    },

    {
        id: "contact",
        title: "12. Contact Us",
        content: (
            <>
                <p>
                    For any questions, concerns, or assistance regarding cancellations,
                    returns, or refunds, please reach out to us:
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
                    Our team is available{" "}
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

export default function RefundPolicyPage() {
    return (
        <LegalPageLayout
            title="Refund & Return Policy"
            subtitle="How cancellations, returns, replacements, and refunds work at Exclusive — including eligibility criteria and timelines."
            lastUpdated={LAST_UPDATED}
            sections={sections}
            currentPath="/refund-policy"
            contact={CONTACT}
        />
    );
}