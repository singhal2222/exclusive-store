import React from "react";
import languages from "../../data/languages.json";
import { FaSackDollar, FaStore, FaBagShopping, FaCoins } from "react-icons/fa6";

const Achivement = () => {
  const icons = {
    store: FaStore,
    dollar: FaCoins,
    shopping: FaBagShopping,
    money: FaSackDollar,
  };

  return (
    <div className="mb-12 w-full sm:mb-16 md:mb-20 lg:mb-24">
      <div className="mx-auto w-full max-w-7xl px-4 font-poppins leading-normal tracking-normal text-black sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 items-center gap-4 sm:gap-5 md:gap-6 lg:grid-cols-4 lg:gap-8">
          {languages.achives.map((achive, index) => {
            const Icon = icons[achive.icon];

            return (
              <div
                key={index}
                className="group flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-[#7A7A7A] px-3 transition-all duration-300 hover:border-0 hover:bg-[#DB4444] hover:text-white sm:h-52 sm:px-4 md:h-56 lg:h-60"
              >
                {/* Icon Circle */}
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#c1c0c1] bg-black text-white transition-all duration-300 group-hover:border-[#e67c7c] group-hover:bg-white group-hover:text-black sm:mb-5 sm:h-16 sm:w-16 sm:border-[6px] md:mb-6 md:h-16 md:w-16 lg:mb-7 lg:h-18 lg:w-18 lg:border-8">
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-9 lg:w-9" />
                </div>

                {/* Quantity */}
                <p className="mb-2 text-xl font-bold tracking-[4%] sm:mb-3 sm:text-2xl md:mb-3 md:text-[26px] lg:mb-4 lg:text-[32px]">
                  {achive.quantity}
                </p>

                {/* Label */}
                <p className="text-center text-xs font-normal sm:text-[13px] md:text-[14px] lg:text-[16px]">
                  {achive.quality}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Achivement;
