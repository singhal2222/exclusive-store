import React from "react";
import Link from "next/link";

const Story = () => {
  return (
    <div className="mb-12 mt-8 w-full sm:mb-16 sm:mt-12 md:mb-20 md:mt-16 lg:mb-24 lg:mt-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 xl:ps-14">
        <div className="font-poppins text-sm font-normal leading-normal tracking-normal text-black sm:text-[15px] md:text-base">
          {/* ================================================== */}
          {/* BREADCRUMB */}
          {/* ================================================== */}

          <div className="mb-8 flex flex-wrap items-center gap-2 text-xs text-[#7A7A7A] sm:mb-12 sm:gap-3 sm:text-[13px] md:mb-16 md:text-[14px] lg:mb-20">
            <Link href="/" className="transition-colors hover:text-[#DB4444]">
              Home
            </Link>

            <span>/</span>

            <Link
              href="/about"
              className="text-black transition-colors hover:text-[#DB4444]"
            >
              About
            </Link>
          </div>

          {/* ================================================== */}
          {/* MAIN GRID */}
          {/* ================================================== */}

          <div className="grid grid-cols-1 items-center gap-8 sm:gap-10 md:gap-12 lg:grid-cols-[40fr_60fr] lg:gap-16 xl:gap-30">
            {/* ================================================== */}
            {/* TEXT */}
            {/* ================================================== */}

            <div className="order-2 lg:order-1">
              <h2 className="mb-6 text-3xl font-semibold tracking-[6%] sm:mb-8 sm:text-4xl md:text-5xl lg:mb-10 lg:text-[54px]">
                Our Story
              </h2>

              <p className="mb-4 text-sm sm:mb-6 sm:text-[15px] md:text-[16px]">
                Launced in 2015, Exclusive is South Asia's premier online
                shopping makterplace with an active presense in Bangladesh.
                Supported by wide range of tailored marketing, data and service
                solutions, Exclusive has 10,500 sallers and 300 brands and
                serves 3 millioons customers across the region.
              </p>

              <p className="text-sm sm:text-[15px] md:text-[16px]">
                Exclusive has more than 1 Million products to offer, growing at
                a very fast. Exclusive offers a diverse assotment in categories
                ranging from consumer.
              </p>
            </div>

            {/* ================================================== */}
            {/* IMAGE */}
            {/* ================================================== */}

            <div className="order-1 w-full lg:order-2">
              <img
                src="/assets/story.png"
                className="h-auto w-full rounded-md object-cover"
                alt="Our Story"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Story;
