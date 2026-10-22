// FILE LOCATION: src/components/legal/LegalPageLayout.jsx

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiArrowUp,
  FiChevronRight,
  FiMail,
  FiPhone,
  FiMapPin,
  FiShield,
  FiFileText,
  FiRefreshCw,
  FiTruck,
} from "react-icons/fi";

// ============================================================
// CONSTANTS
// ============================================================

const LEGAL_LINKS = [
  {
    name: "Privacy Policy",
    path: "/privacy-policy",
    icon: FiShield,
    description: "How we collect, use, and protect your data",
  },
  {
    name: "Terms & Conditions",
    path: "/terms",
    icon: FiFileText,
    description: "The rules for using our store and services",
  },
  {
    name: "Refund Policy",
    path: "/refund-policy",
    icon: FiRefreshCw,
    description: "When and how refunds are issued",
  },
  {
    name: "Shipping Policy",
    path: "/shipping-policy",
    icon: FiTruck,
    description: "Delivery timelines, charges, and coverage",
  },
];

// ============================================================
// COMPONENT
// ============================================================

const LegalPageLayout = ({
  title,
  subtitle,
  lastUpdated,
  sections = [],
  currentPath = "",
  contact = {
    email: "ysinghal157@gmail.com",
    phone: "+91-9389602911",
    address:
      "Devout Tech Consultants, 6th Floor, Vista Tower, Phase-8A, Sector-75, Mohali, Punjab, India",
  },
}) => {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || "");
  const [showBackToTop, setShowBackToTop] = useState(false);

  // ==========================================================
  // SECTIONS HASH FOR ACTIVE LINK
  // ==========================================================

  const sectionIds = useMemo(
    () => sections.map((s) => s.id).filter(Boolean),
    [sections],
  );

  // ==========================================================
  // SCROLL OBSERVER — HIGHLIGHT ACTIVE TOC ITEM
  // ==========================================================

  useEffect(() => {
    if (sectionIds.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost visible section
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              a.target.getBoundingClientRect().top -
              b.target.getBoundingClientRect().top,
          );

        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: "-120px 0px -60% 0px",
        threshold: 0,
      },
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sectionIds]);

  // ==========================================================
  // BACK-TO-TOP VISIBILITY
  // ==========================================================

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ==========================================================
  // SMOOTH SCROLL TO SECTION
  // ==========================================================

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (!element) return;

    const offset = 100; // account for sticky header
    const top = element.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({ top, behavior: "smooth" });
  };

  // ==========================================================
  // BACK TO TOP
  // ==========================================================

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section className="w-full bg-[#F5F5F5] px-4 py-8 font-poppins sm:px-6 sm:py-10 lg:px-10 lg:py-14">
      <div className="mx-auto w-full max-w-7xl">
        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="mb-8 rounded-xl border border-[#E5E5E5] bg-white p-5 sm:mb-10 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-3 sm:gap-4">
            <h1 className="text-2xl font-semibold tracking-[0.02em] text-black sm:text-3xl md:text-4xl">
              {title}
            </h1>

            {subtitle && (
              <p className="max-w-3xl text-xs leading-5 text-[#7A7A7A] sm:text-sm sm:leading-6">
                {subtitle}
              </p>
            )}

            {lastUpdated && (
              <p className="text-[10px] text-[#999999] sm:text-xs">
                Last updated:{" "}
                <span className="font-medium text-[#555]">{lastUpdated}</span>
              </p>
            )}
          </div>
        </div>

        {/* ================================================== */}
        {/* MAIN GRID */}
        {/* ================================================== */}

        <div className="grid gap-6 sm:gap-7 lg:grid-cols-[280px_1fr] lg:gap-10">
          {/* ============================================= */}
          {/* SIDEBAR — TABLE OF CONTENTS */}
          {/* ============================================= */}

          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#7A7A7A] sm:mb-4 sm:text-[13px]">
                On This Page
              </h2>

              {sections.length > 0 ? (
                <nav className="flex flex-col gap-0.5">
                  {sections.map((section) => {
                    const isActive = activeSection === section.id;

                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => scrollToSection(section.id)}
                        className={`group flex items-start gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors sm:text-[13px] ${
                          isActive
                            ? "bg-[#FFF5F5] font-medium text-[#DB4444]"
                            : "text-[#7A7A7A] hover:bg-[#F5F5F5] hover:text-black"
                        }`}
                      >
                        <FiChevronRight
                          size={14}
                          className={`mt-0.5 shrink-0 transition-transform ${
                            isActive
                              ? "translate-x-0.5 text-[#DB4444]"
                              : "text-[#CCCCCC] group-hover:text-[#7A7A7A]"
                          }`}
                        />

                        <span className="leading-5">{section.title}</span>
                      </button>
                    );
                  })}
                </nav>
              ) : (
                <p className="text-xs text-[#999999]">No sections available.</p>
              )}
            </div>
          </aside>

          {/* ============================================= */}
          {/* MAIN CONTENT */}
          {/* ============================================= */}

          <div className="min-w-0">
            <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 sm:p-7 lg:p-9">
              {/* ========================================= */}
              {/* SECTIONS */}
              {/* ========================================= */}

              {sections.length > 0 ? (
                <div className="space-y-8 sm:space-y-10">
                  {sections.map((section, index) => (
                    <div
                      key={section.id}
                      id={section.id}
                      className={
                        index === sections.length - 1
                          ? ""
                          : "border-b border-[#F0F0F0] pb-8 sm:pb-10"
                      }
                    >
                      <h2 className="mb-3 text-base font-semibold text-black sm:mb-4 sm:text-lg lg:text-xl">
                        {section.title}
                      </h2>

                      <div className="prose-legal space-y-3 text-xs leading-6 text-[#555] sm:text-sm sm:leading-7">
                        {typeof section.content === "string" ? (
                          <p>{section.content}</p>
                        ) : (
                          section.content
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#7A7A7A]">Content coming soon.</p>
              )}

              {/* ========================================= */}
              {/* CONTACT BLOCK */}
              {/* ========================================= */}

              <div className="mt-10 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] p-4 sm:mt-12 sm:p-5">
                <h3 className="mb-3 text-sm font-semibold text-black sm:text-base">
                  Contact Us
                </h3>

                <p className="mb-4 text-xs leading-5 text-[#7A7A7A] sm:text-sm sm:leading-6">
                  If you have any questions about this policy, please reach out
                  to us using the details below.
                </p>

                <div className="space-y-3">
                  {/* Email */}

                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF5F5] text-[#DB4444]">
                      <FiMail size={15} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-[#999999] sm:text-[11px]">
                        Email
                      </p>

                      <a
                        href={`mailto:${contact.email}`}
                        className="break-all text-xs text-black transition-colors hover:text-[#DB4444] sm:text-sm"
                      >
                        {contact.email}
                      </a>
                    </div>
                  </div>

                  {/* Phone */}

                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF5F5] text-[#DB4444]">
                      <FiPhone size={15} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-[#999999] sm:text-[11px]">
                        Phone
                      </p>

                      <a
                        href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
                        className="text-xs text-black transition-colors hover:text-[#DB4444] sm:text-sm"
                      >
                        {contact.phone}
                      </a>
                    </div>
                  </div>

                  {/* Address */}

                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF5F5] text-[#DB4444]">
                      <FiMapPin size={15} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-[#999999] sm:text-[11px]">
                        Address
                      </p>

                      <p className="text-xs leading-5 text-black sm:text-sm sm:leading-6">
                        {contact.address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================== */}
        {/* RELATED LEGAL PAGES */}
        {/* ================================================== */}

        <div className="mt-8 sm:mt-10 lg:mt-12">
          <h2 className="mb-4 text-base font-semibold text-black sm:mb-5 sm:text-lg">
            Other Legal Pages
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {LEGAL_LINKS.filter((link) => link.path !== currentPath).map(
              (link) => {
                const Icon = link.icon;

                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    className="group flex items-start gap-3 rounded-xl border border-[#E5E5E5] bg-white p-4 transition-all hover:border-[#DB4444] hover:shadow-sm sm:p-5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF5F5] text-[#DB4444] transition-colors group-hover:bg-[#DB4444] group-hover:text-white">
                      <Icon size={18} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-xs font-semibold text-black sm:text-sm">
                        {link.name}
                      </h3>

                      <p className="mt-1 text-[10px] leading-4 text-[#7A7A7A] sm:text-[12px] sm:leading-5">
                        {link.description}
                      </p>
                    </div>
                  </Link>
                );
              },
            )}
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* BACK TO TOP */}
      {/* ================================================== */}

      {showBackToTop && (
        <button
          type="button"
          onClick={handleBackToTop}
          aria-label="Back to top"
          className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-[#DB4444] text-white shadow-lg transition-all hover:bg-[#C83D3D] sm:bottom-8 sm:right-8 sm:h-12 sm:w-12"
        >
          <FiArrowUp size={18} />
        </button>
      )}
    </section>
  );
};

export default LegalPageLayout;
