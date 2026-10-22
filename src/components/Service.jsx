import React from "react";
import { FaTruckFast, FaHandHoldingDollar } from "react-icons/fa6";
import { BiSupport } from "react-icons/bi";
import languages from "../data/languages.json";

const Service = () => {
  const icons = {
    delivery: FaTruckFast,
    customer: BiSupport,
    guarantee: FaHandHoldingDollar,
  };
  return (
    <div className="mb-12 w-full sm:mb-16 md:mb-20 lg:mb-24">
      <div className="mx-auto w-full max-w-5xl px-4 font-poppins leading-normal tracking-normal sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap10 items-center sm:grid-cols-2 sm:gap-12 md:grid-cols-3 md:gap-16 lg:gap-22">
          {languages.services.map((service, index) => {
            const Icon = icons[service.icon];
            return (
              <div
                key={index}
                className="flex flex-col items-center justify-center text-center text-black"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#c1c0c1] bg-black text-white sm:mb-6 sm:h-16 sm:w-16 sm:border-[6px] md:h-18 md:w-18 md:border-8">
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-9 md:w-9" />
                </div>

                <p className="mb-2 text-[14px] font-semibold tracking-[3%] sm:mb-3 sm:text-base md:mb-4 md:text-lg">
                  {service.name}
                </p>

                <p className="max-w-xs text-[11px] font-normal sm:text-xs md:text-[13px]">
                  {service.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Service;