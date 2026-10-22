import React from "react";
import Link from "next/link";

const Speaker = () => {
  return (
    <div className="mb-12 w-full sm:mb-16 md:mb-20 lg:mb-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="font-poppins text-sm font-semibold leading-normal tracking-normal text-white sm:text-[15px] md:text-base">
          <div className="relative w-full overflow-hidden rounded-md">
            <img
              src="/assets/speaker.png"
              className="h-auto w-full object-cover"
              alt="Speaker"
            />

            <div className="absolute left-4 top-1/2 w-[calc(100%-2rem)] max-w-[80%] -translate-y-1/2 sm:left-8 sm:max-w-[70%] md:left-12 md:max-w-[60%] lg:left-14 lg:max-w-[55%]">
              <p className="mb-3 text-xs text-[#00FF66] sm:mb-5 sm:text-sm md:mb-7 md:text-[15px] lg:mb-9 lg:text-base">
                Categories
              </p>

              <h2 className="mb-4 text-lg font-semibold leading-tight tracking-[4%] sm:mb-6 sm:text-2xl md:mb-8 md:text-3xl lg:mb-11 lg:text-[50px]">
                Enhance Your
                <br />
                Music Experience
              </h2>

              <Link
                href="/shop"
                className="inline-flex cursor-pointer items-center justify-center rounded-md border-0 bg-[#00FF66] px-6 py-2.5 text-xs font-medium text-black outline-0 transition-colors hover:bg-white hover:text-[#00FF66] sm:px-8 sm:py-3 sm:text-sm md:px-10 md:py-3.5 md:text-[15px] lg:px-14 lg:py-4 lg:text-base"
              >
                Buy Now!
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Speaker;