// FILE LOCATION: src/app/(website)/privacy-policy/page.js

import LegalPageLayout from "@/components/legal/LegalPageLayout";

// ============================================================
// PAGE METADATA
// ============================================================

export const metadata = {
    title: "Privacy Policy | Exclusive",
    description:
        "Learn how Exclusive collects, uses, stores, and protects your personal information when you shop with us.",
    robots: {
        index: true,
        follow: true,
    },
    alternates: {
        canonical: "/privacy-policy",
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
        title: "1. Introduction",
        content: (
            <>
                <p>
                    Welcome to <strong>Exclusive</strong> (&quot;we&quot;,
                    &quot;our&quot;, or &quot;us&quot;). Your privacy is important to
                    us, and we are committed to protecting the personal information
                    you share with us.
                </p>

                <p>
                    This Privacy Policy explains how we collect, use, disclose, and
                    safeguard your information when you visit our website, create an
                    account, place an order, or interact with our services. By using
                    our website, you agree to the practices described in this policy.
                </p>

                <p>
                    This policy is published in accordance with the{" "}
                    <strong>
                        Information Technology Act, 2000
                    </strong>{" "}
                    and the rules made thereunder, including the{" "}
                    <strong>
                        Information Technology (Reasonable Security Practices and
                        Procedures and Sensitive Personal Data or Information) Rules,
                        2011
                    </strong>
                    .
                </p>
            </>
        ),
    },

    {
        id: "information-we-collect",
        title: "2. Information We Collect",
        content: (
            <>
                <p>
                    We collect information that you provide directly to us, as well as
                    information that is generated automatically when you use our
                    website.
                </p>

                <p>
                    <strong>Information you provide to us:</strong>
                </p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>
                        <strong>Account Information:</strong> Your name, email address,
                        phone number, and password when you create an account.
                    </li>
                    <li>
                        <strong>Order Information:</strong> Shipping address, billing
                        address, and order details when you make a purchase.
                    </li>
                    <li>
                        <strong>Payment Information:</strong> Payment method and
                        transaction details. We do not store your full card or UPI
                        credentials — payments are processed by our secure payment
                        partners.
                    </li>
                    <li>
                        <strong>Communication:</strong> Any messages, reviews, or
                        feedback you send us through the website.
                    </li>
                </ul>

                <p>
                    <strong>Information collected automatically:</strong>
                </p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>IP address and approximate location</li>
                    <li>Browser type and device information</li>
                    <li>Pages you visit, time spent, and referring URLs</li>
                    <li>Cookies and similar tracking technologies</li>
                </ul>
            </>
        ),
    },

    {
        id: "how-we-use",
        title: "3. How We Use Your Information",
        content: (
            <>
                <p>We use the information we collect for the following purposes:</p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>
                        To create and manage your account, and to authenticate your
                        login.
                    </li>
                    <li>
                        To process, fulfil, and deliver your orders, and to communicate
                        order-related updates.
                    </li>
                    <li>
                        To process payments securely through our payment partners.
                    </li>
                    <li>
                        To respond to your inquiries, complaints, or support requests.
                    </li>
                    <li>
                        To send transactional emails such as order confirmations,
                        shipping updates, and password reset links.
                    </li>
                    <li>
                        To send marketing communications, only if you have opted in.
                    </li>
                    <li>
                        To personalise your shopping experience and recommend relevant
                        products.
                    </li>
                    <li>
                        To detect, prevent, and address fraud, security incidents, or
                        misuse of our services.
                    </li>
                    <li>
                        To comply with applicable legal obligations under Indian law.
                    </li>
                </ul>
            </>
        ),
    },

    {
        id: "cookies",
        title: "4. Cookies and Similar Technologies",
        content: (
            <>
                <p>
                    Our website uses cookies and similar tracking technologies to
                    enhance your browsing experience, remember your preferences, and
                    analyse site traffic.
                </p>

                <p>We use the following types of cookies:</p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>
                        <strong>Essential Cookies:</strong> Required for the website to
                        function (e.g., maintaining your login session and cart items).
                    </li>
                    <li>
                        <strong>Analytics Cookies:</strong> Help us understand how
                        visitors interact with our site so we can improve it.
                    </li>
                    <li>
                        <strong>Preference Cookies:</strong> Remember your settings and
                        preferences for future visits.
                    </li>
                </ul>

                <p>
                    You can control or disable cookies through your browser settings.
                    However, disabling essential cookies may affect the functionality
                    of the website.
                </p>
            </>
        ),
    },

    {
        id: "payment-information",
        title: "5. Payment Information",
        content: (
            <>
                <p>
                    All payments on our website are processed through secure,
                    third-party payment gateways such as{" "}
                    <strong>Razorpay</strong> and similar providers. These providers
                    are PCI-DSS compliant and handle your payment details directly.
                </p>

                <p>
                    We do not store, process, or have access to your full credit card
                    numbers, debit card numbers, UPI IDs, net banking credentials, or
                    CVV. We only receive a transaction status and reference number
                    from the payment gateway to confirm your order.
                </p>

                <p>
                    We recommend that you never share your payment credentials with
                    anyone, including us.
                </p>
            </>
        ),
    },

    {
        id: "sharing-information",
        title: "6. Sharing Your Information",
        content: (
            <>
                <p>
                    We do not sell, rent, or trade your personal information to third
                    parties. We may share your information only in the following
                    circumstances:
                </p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>
                        <strong>Service Providers:</strong> With trusted third-party
                        partners who help us operate our business — such as payment
                        gateways, courier companies, email service providers, and cloud
                        storage providers. These partners are contractually obligated to
                        protect your data.
                    </li>
                    <li>
                        <strong>Legal Requirements:</strong> If required by law, court
                        order, or government authority, we may disclose your information
                        to comply with legal obligations.
                    </li>
                    <li>
                        <strong>Business Transfers:</strong> In the event of a merger,
                        acquisition, or sale of assets, your information may be
                        transferred to the acquiring entity.
                    </li>
                    <li>
                        <strong>With Your Consent:</strong> We may share your
                        information for any other purpose with your explicit consent.
                    </li>
                </ul>
            </>
        ),
    },

    {
        id: "data-retention",
        title: "7. Data Retention",
        content: (
            <>
                <p>
                    We retain your personal information for as long as your account is
                    active, or for as long as necessary to fulfil the purposes
                    described in this Privacy Policy.
                </p>

                <p>
                    When you delete your account, we will delete or anonymise your
                    personal information within a reasonable period, except where we
                    are required to retain it for legal, tax, or regulatory purposes.
                    For example, order records and invoices may be retained for up to
                    8 years as required under Indian tax laws.
                </p>
            </>
        ),
    },

    {
        id: "data-security",
        title: "8. Data Security",
        content: (
            <>
                <p>
                    We take reasonable technical and organisational measures to
                    protect your personal information from unauthorised access,
                    alteration, disclosure, or destruction. These measures include:
                </p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>Encrypted transmission (HTTPS) across the entire website</li>
                    <li>Password hashing using industry-standard algorithms</li>
                    <li>Secure HTTP-only cookies for sessions</li>
                    <li>Restricted access to personal data on a need-to-know basis</li>
                </ul>

                <p>
                    However, please note that no method of transmission or storage is
                    100% secure. While we strive to protect your personal information,
                    we cannot guarantee absolute security.
                </p>
            </>
        ),
    },

    {
        id: "your-rights",
        title: "9. Your Rights",
        content: (
            <>
                <p>
                    As a user of our website, you have the following rights with
                    respect to your personal information:
                </p>

                <ul className="ml-5 list-disc space-y-1.5">
                    <li>
                        <strong>Access:</strong> Request a copy of the personal
                        information we hold about you.
                    </li>
                    <li>
                        <strong>Correction:</strong> Request correction of any
                        inaccurate or incomplete information.
                    </li>
                    <li>
                        <strong>Deletion:</strong> Request deletion of your account and
                        personal information, subject to legal retention obligations.
                    </li>
                    <li>
                        <strong>Opt-out:</strong> Unsubscribe from marketing
                        communications at any time by clicking the unsubscribe link in
                        any marketing email, or by contacting us.
                    </li>
                    <li>
                        <strong>Withdraw Consent:</strong> Withdraw your consent for
                        data processing at any time, where consent was the basis for
                        processing.
                    </li>
                </ul>

                <p>
                    To exercise any of these rights, please contact us using the
                    details provided at the end of this policy.
                </p>
            </>
        ),
    },

    {
        id: "children-privacy",
        title: "10. Children's Privacy",
        content: (
            <>
                <p>
                    Our website is not intended for children under the age of 18. We
                    do not knowingly collect personal information from children.
                </p>

                <p>
                    If you are a parent or guardian and believe that your child has
                    provided us with personal information, please contact us
                    immediately so we can take appropriate action.
                </p>
            </>
        ),
    },

    {
        id: "third-party-links",
        title: "11. Third-Party Links",
        content: (
            <>
                <p>
                    Our website may contain links to third-party websites, including
                    social media platforms, payment gateways, and partner sites. We
                    are not responsible for the privacy practices or content of those
                    websites.
                </p>

                <p>
                    We encourage you to review the privacy policies of any third-party
                    websites you visit through links on our site.
                </p>
            </>
        ),
    },

    {
        id: "changes",
        title: "12. Changes to This Policy",
        content: (
            <>
                <p>
                    We may update this Privacy Policy from time to time to reflect
                    changes in our practices, technology, legal requirements, or other
                    factors.
                </p>

                <p>
                    When we make material changes, we will update the &quot;Last
                    updated&quot; date at the top of this page and, where appropriate,
                    notify you via email or a prominent notice on our website.
                </p>

                <p>
                    Your continued use of our website after any changes constitutes
                    your acceptance of the updated Privacy Policy.
                </p>
            </>
        ),
    },
];

// ============================================================
// PAGE COMPONENT
// ============================================================

export default function PrivacyPolicyPage() {
    return (
        <LegalPageLayout
            title="Privacy Policy"
            subtitle="How Exclusive collects, uses, stores, and protects your personal information when you shop with us."
            lastUpdated={LAST_UPDATED}
            sections={sections}
            currentPath="/privacy-policy"
            contact={CONTACT}
        />
    );
}