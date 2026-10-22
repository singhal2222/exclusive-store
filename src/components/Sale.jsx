import React from "react";
import Link from "next/link";

const Sale = () => {
  return (
    <div className="w-full bg-black">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="font-poppins text-xs font-medium leading-normal tracking-normal text-black sm:text-[13px] md:text-[14px] lg:text-[16px]">
          <div className="relative flex flex-col items-center justify-center gap-2 py-3 text-center text-white sm:py-4 md:flex-row md:gap-0 md:py-5 md:text-left">
            {/* ================================================== */}
            {/* SALE MESSAGE */}
            {/* ================================================== */}

            <div className="flex flex-wrap items-center justify-center gap-2 px-10 sm:gap-2.5 md:px-0">
              <p className="text-[11px] leading-4 sm:text-xs sm:leading-5 md:text-[13px] lg:text-[14px] xl:text-[16px]">
                Summer Sale For All Swim Suits And Free Express Delivery - OFF
                50%!
              </p>

              <Link
                href="/"
                className="border-0 text-[11px] font-bold underline transition-colors hover:text-[#DB4444] sm:text-xs md:text-[13px] lg:text-[14px] xl:text-[16px]"
              >
                ShopNow
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sale;