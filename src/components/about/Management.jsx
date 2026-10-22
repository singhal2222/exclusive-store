import React from "react";
import languages from "../../data/languages.json";
import { FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";

const Management = () => {
  return (
    <div className="mb-16 w-full sm:mb-24 md:mb-32 lg:mb-48">
      <div className="mx-auto w-full max-w-7xl px-4 font-poppins leading-normal tracking-normal text-black sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-8 sm:grid-cols-2 sm:gap-8 md:gap-10 lg:grid-cols-3 lg:gap-10">
          {languages.managements.map((management, index) => (
            <div key={index} className="w-full">
              {/* Image Card */}
              <div className="mb-5 flex h-72 w-full items-end justify-center overflow-hidden rounded-lg bg-[#F5F5F5] sm:mb-6 sm:h-80 md:mb-7 md:h-88 lg:mb-9 lg:h-100">
                <img
                  src={management.image}
                  className="max-h-full max-w-full object-contain"
                  alt={management.name}
                  loading="lazy"
                />
              </div>

              {/* Name */}
              <p className="mb-2 text-xl font-medium tracking-[4%] sm:mb-2.5 sm:text-2xl md:mb-3 md:text-[28px] lg:text-[32px]">
                {management.name}
              </p>

              {/* Position */}
              <p className="mb-3 text-sm font-normal sm:mb-4 sm:text-[15px] md:mb-5 md:text-[16px]">
                {management.post}
              </p>

              {/* Social Links */}
              <div className="flex items-center gap-4 text-black sm:gap-5">
                <a
                  href="#"
                  aria-label={`${management.name} on Twitter`}
                  className="transition-colors hover:text-[#DB4444]"
                >
                  <FaTwitter size={18} className="sm:hidden" />
                  <FaTwitter size={20} className="hidden sm:block" />
                </a>

                <a
                  href="#"
                  aria-label={`${management.name} on Instagram`}
                  className="transition-colors hover:text-[#DB4444]"
                >
                  <FaInstagram size={18} className="sm:hidden" />
                  <FaInstagram size={20} className="hidden sm:block" />
                </a>

                <a
                  href="#"
                  aria-label={`${management.name} on LinkedIn`}
                  className="transition-colors hover:text-[#DB4444]"
                >
                  <FaLinkedinIn size={18} className="sm:hidden" />
                  <FaLinkedinIn size={20} className="hidden sm:block" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Management;
