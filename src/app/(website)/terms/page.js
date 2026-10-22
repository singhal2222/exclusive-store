// FILE LOCATION: src/app/(website)/terms/page.js

import LegalPageLayout from "@/components/legal/LegalPageLayout";

// ============================================================
// PAGE METADATA
// ============================================================

export const metadata = {
    title: "Terms & Conditions | Exclusive",
    description:
        "Read the Terms & Conditions governing your use of the Exclusive website and your purchases from our store.",
    robots: {
        index: true,
        follow: true,
    },
    alternates: {
        canonical: "/terms",
    },
};

// ============================================================
// LEGAL CONTENT
// ============================================================

const LAST_UPDATED = "October 12, 2026";

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
        title: "1. Introduction and Acceptance",
        content: (
            <>
                <p>
                    Welcome to <strong>Exclusive</strong> (&quot;we&quot;,
                    &quot;our&quot;, or &quot;us&quot;). These Terms &amp; Conditions
                    (&quot;Terms&quot;) govern your access to and use of our website,
                    products, and services.
                </p>

                <p>
                    By accessing our website, creating an account, or placing an order,
                    you confirm that you have read, understood, and agreed to be bound
                    by these Terms. If you do not agree with any part of these Terms,
                    please do not use our website or services.
                </p>

                <p>
                    These Terms are published in accordance with the{" "}
                    <strong>Information Technology Act, 2000</strong>, the{" "}
                    <strong>Consumer Protection Act, 2019</strong>, and the rules made
                    thereunder, including the{" "}
                    <strong>
                        Consumer Protection (E-Commerce) Rules, 2020
                    </strong>
                    .
                </p>
            </>
        ),
    },

    {
        id: "eligibility",
        title: "2. Eligibility",
        content: (
            <>
                <p>To use our website and place orders, you must:</p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>Be at least 18 years of age, or</li>
                    <li>
                        Be accessing the website under the supervision of a parent or
                        legal guardian.
                    </li>
                    <li>
                        Be capable of entering into a legally binding contract under the
                        Indian Contract Act, 1872.
                    </li>
                    <li>
                        Provide accurate, current, and complete information when
                        creating an account or placing an order.
                    </li>
                </ul>

                <p>
                    We reserve the right to refuse service, terminate accounts, or
                    cancel orders if we believe a user does not meet these eligibility
                    criteria or has violated any part of these Terms.
                </p>
            </>
        ),
    },

    {
        id: "account-registration",
        title: "3. Account Registration",
        content: (
            <>
                <p>
                    To access certain features of our website, you may need to create
                    an account. When you do, you agree to:
                </p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>
                        Provide accurate, current, and complete information during
                        registration.
                    </li>
                    <li>
                        Keep your account password confidential and not share it with
                        anyone.
                    </li>
                    <li>
                        Notify us immediately of any unauthorised access to or use of
                        your account.
                    </li>
                    <li>
                        Take full responsibility for all activities that occur under
                        your account.
                    </li>
                </ul>

                <p>
                    You may delete your account at any time through your account
                    settings. We may also suspend or terminate your account if we
                    detect any violation of these Terms or suspicious activity.
                </p>
            </>
        ),
    },

    {
        id: "products-pricing",
        title: "4. Products and Pricing",
        content: (
            <>
                <p>
                    We make every effort to display our products and their colours,
                    features, and specifications as accurately as possible. However,
                    actual product appearance may vary slightly due to photography,
                    display settings, and manufacturer variations.
                </p>

                <p>
                    <strong>Pricing:</strong>
                </p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>
                        All prices are listed in <strong>Indian Rupees (₹)</strong> and
                        are inclusive of applicable GST unless stated otherwise.
                    </li>
                    <li>
                        Prices are subject to change without prior notice. However,
                        changes will not affect orders that have already been confirmed.
                    </li>
                    <li>
                        In case of a pricing error, we reserve the right to cancel the
                        order and issue a full refund.
                    </li>
                    <li>
                        Discounts, coupons, and promotional offers are valid only for
                        the stated period and may have additional terms.
                    </li>
                </ul>

                <p>
                    <strong>Availability:</strong> All products are subject to
                    availability. If a product becomes unavailable after you place an
                    order, we will notify you and issue a full refund.
                </p>
            </>
        ),
    },

    {
        id: "orders",
        title: "5. Orders and Acceptance",
        content: (
            <>
                <p>
                    Placing an order on our website constitutes an{" "}
                    <strong>offer to purchase</strong>. Your order is not confirmed
                    until we accept it and send you an order confirmation email or
                    SMS.
                </p>

                <p>We reserve the right to refuse or cancel any order for reasons including but not limited to:</p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>Product unavailability or stock issues</li>
                    <li>Incorrect pricing or product information</li>
                    <li>Errors in your order details or address</li>
                    <li>Suspected fraud or misuse of our services</li>
                    <li>Violation of these Terms or applicable law</li>
                </ul>

                <p>
                    If we cancel your order after payment has been made, we will issue
                    a full refund to your original payment method within the timelines
                    stated in our Refund Policy.
                </p>
            </>
        ),
    },

    {
        id: "payment",
        title: "6. Payment Terms",
        content: (
            <>
                <p>We accept the following payment methods:</p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>
                        <strong>Online Payments:</strong> Credit cards, debit cards, UPI,
                        net banking, and wallets via our secure payment partners
                        (Razorpay or similar providers).
                    </li>
                    <li>
                        <strong>Cash on Delivery (COD):</strong> Available on eligible
                        pin codes and orders, subject to additional COD charges if
                        applicable.
                    </li>
                </ul>

                <p>
                    By providing payment information, you confirm that you are
                    authorised to use the payment method. All online payments are
                    processed through PCI-DSS compliant gateways. We do not store your
                    full card details on our servers.
                </p>

                <p>
                    Failed payments, chargebacks, or disputes may result in
                    cancellation of your order and suspension of your account.
                </p>
            </>
        ),
    },

    {
        id: "shipping",
        title: "7. Shipping and Delivery",
        content: (
            <>
                <p>
                    We ship to addresses within India. For detailed information about
                    shipping timelines, charges, and coverage, please refer to our{" "}
                    <a
                        href="/shipping-policy"
                        className="font-medium text-[#DB4444] hover:underline"
                    >
                        Shipping Policy
                    </a>
                    .
                </p>

                <p>
                    Delivery timelines are estimates and may vary due to factors
                    beyond our control, including weather, courier delays, public
                    holidays, and events such as strikes or natural disasters.
                </p>

                <p>
                    It is your responsibility to provide accurate and complete
                    delivery information. If a delivery fails due to an incorrect
                    address or your unavailability, additional shipping charges may
                    apply for re-delivery.
                </p>
            </>
        ),
    },

    {
        id: "cancellations",
        title: "8. Cancellations",
        content: (
            <>
                <p>
                    You may cancel your order free of charge before it has been
                    shipped. Once an order has been shipped, it cannot be cancelled
                    but may be eligible for return as per our Refund Policy.
                </p>

                <p>
                    To cancel an order, please use the cancel option in your account
                    orders page, or contact us using the details at the end of this
                    page. We will process cancellation requests as quickly as
                    possible.
                </p>

                <p>
                    We may also cancel orders on our own initiative in the following
                    cases:
                </p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>Product unavailability after order placement</li>
                    <li>Pricing errors or technical glitches</li>
                    <li>Suspected fraudulent activity</li>
                    <li>Non-serviceable pin code</li>
                </ul>
            </>
        ),
    },

    {
        id: "returns-refunds",
        title: "9. Returns and Refunds",
        content: (
            <>
                <p>
                    We want you to be completely satisfied with your purchase. If you
                    are not satisfied, you may be eligible to return the product and
                    receive a refund, subject to our{" "}
                    <a
                        href="/refund-policy"
                        className="font-medium text-[#DB4444] hover:underline"
                    >
                        Refund Policy
                    </a>
                    .
                </p>

                <p>
                    In summary, returns are accepted only if the product is unused, in
                    its original packaging, and the return request is raised within
                    the specified return window. Certain products may be non-returnable
                    for hygiene or safety reasons.
                </p>

                <p>
                    Refunds, where applicable, will be processed to the original
                    payment method within the timelines specified in the Refund
                    Policy.
                </p>
            </>
        ),
    },

    {
        id: "intellectual-property",
        title: "10. Intellectual Property",
        content: (
            <>
                <p>
                    All content on this website — including but not limited to text,
                    images, logos, product descriptions, graphics, icons, and software
                    — is the property of{" "}
                    <strong>Exclusive</strong> or its content suppliers, and is
                    protected by Indian and international copyright, trademark, and
                    other intellectual property laws.
                </p>

                <p>
                    You may not reproduce, distribute, modify, republish, upload, or
                    use any content from this website for commercial purposes without
                    our prior written consent.
                </p>

                <p>
                    Any unauthorised use of our intellectual property may result in
                    legal action.
                </p>
            </>
        ),
    },

    {
        id: "prohibited-activities",
        title: "11. Prohibited Activities",
        content: (
            <>
                <p>When using our website, you agree NOT to:</p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>
                        Violate any applicable law, regulation, or these Terms.
                    </li>
                    <li>
                        Provide false, misleading, or inaccurate information.
                    </li>
                    <li>
                        Impersonate any person or entity, or falsely represent your
                        affiliation.
                    </li>
                    <li>
                        Use the website for any unlawful or fraudulent purpose.
                    </li>
                    <li>
                        Attempt to gain unauthorised access to our systems, servers, or
                        accounts.
                    </li>
                    <li>
                        Introduce viruses, malware, or any other harmful code.
                    </li>
                    <li>
                        Engage in any activity that disrupts or interferes with our
                        services.
                    </li>
                    <li>
                        Scrape, harvest, or collect user information without consent.
                    </li>
                    <li>
                        Post abusive, obscene, defamatory, or offensive content.
                    </li>
                </ul>

                <p>
                    Violation of these prohibitions may result in immediate
                    termination of your account and legal action where appropriate.
                </p>
            </>
        ),
    },

    {
        id: "limitation-of-liability",
        title: "12. Limitation of Liability",
        content: (
            <>
                <p>
                    To the maximum extent permitted by law,{" "}
                    <strong>Exclusive</strong>, its directors, employees, and agents
                    shall not be liable for any indirect, incidental, special,
                    consequential, or punitive damages arising out of or related to:
                </p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>Your use of, or inability to use, our website</li>
                    <li>Unauthorised access to your account or information</li>
                    <li>Delays in delivery caused by third parties</li>
                    <li>Product defects beyond our reasonable control</li>
                    <li>Any other cause beyond our reasonable control</li>
                </ul>

                <p>
                    Our total liability for any claim arising out of your use of our
                    website or products shall not exceed the amount you paid for the
                    specific product or service in question.
                </p>
            </>
        ),
    },

    {
        id: "governing-law",
        title: "13. Governing Law and Jurisdiction",
        content: (
            <>
                <p>
                    These Terms are governed by and construed in accordance with the
                    laws of <strong>India</strong>.
                </p>

                <p>
                    Any dispute arising out of or in connection with these Terms or
                    your use of our website shall be subject to the exclusive
                    jurisdiction of the courts located in{" "}
                    <strong>Mohali, Punjab, India</strong>.
                </p>

                <p>
                    Before initiating any legal proceedings, we encourage you to
                    contact us to resolve the matter amicably.
                </p>
            </>
        ),
    },

    {
        id: "changes",
        title: "14. Changes to These Terms",
        content: (
            <>
                <p>
                    We reserve the right to update or modify these Terms at any time
                    without prior notice. When we make material changes, we will
                    update the &quot;Last updated&quot; date at the top of this page.
                </p>

                <p>
                    Your continued use of our website after any changes constitutes
                    your acceptance of the revised Terms. We encourage you to review
                    this page periodically to stay informed.
                </p>

                <p>
                    If you do not agree with any changes, you may discontinue using
                    our website and delete your account.
                </p>
            </>
        ),
    },
];

// ============================================================
// PAGE COMPONENT
// ============================================================

export default function TermsPage() {
    return (
        <LegalPageLayout
            title="Terms & Conditions"
            subtitle="The rules that govern your use of the Exclusive website and your purchases from our store."
            lastUpdated={LAST_UPDATED}
            sections={sections}
            currentPath="/terms"
            contact={CONTACT}
        />
    );
}