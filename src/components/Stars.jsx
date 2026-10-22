// FILE LOCATION: src/components/Stars.jsx

import React from "react";
import { BsStarFill, BsStarHalf } from "react-icons/bs";

// ============================================================
// STARS COMPONENT
// ============================================================
//
// Displays a 5-star rating visualisation.
//
// Props:
//   - rating      (number, optional, default 0)  — 0 to 5
//   - reviewCount (number, optional)             — total approved reviews
//   - size        (string, optional, default "")  — extra size classes
//
// Behavior:
//   - If reviewCount is provided AND equals 0 → renders "No reviews yet"
//     instead of an empty star row.
//   - Otherwise → renders the traditional 5-star row.
//
// ============================================================

const STARS_COUNT = 5;

const DEFAULT_STAR_SIZE =
  "h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 lg:h-5 lg:w-5";

const Stars = ({ rating = 0, reviewCount, size }) => {
  // ----------------------------------------
  // Empty state — no reviews yet
  // ----------------------------------------
  //
  // When reviewCount is explicitly 0, don't render an empty
  // star row. Show a soft "No reviews yet" message instead.
  //
  // ----------------------------------------

  const hasNoReviews = typeof reviewCount === "number" && reviewCount === 0;

  if (hasNoReviews) {
    return (
      <div className="flex flex-row flex-wrap items-center gap-1 sm:gap-1.5 md:gap-2">
        <span className="text-[11px] font-normal text-[#7A7A7A] sm:text-xs md:text-[13px]">
          No reviews yet
        </span>
      </div>
    );
  }

  // ----------------------------------------
  // Safe numeric rating
  // ----------------------------------------

  const numericRating = Number(rating);

  const safeRating = Number.isFinite(numericRating)
    ? Math.max(0, Math.min(5, numericRating))
    : 0;

  // ----------------------------------------
  // Build the star array
  // ----------------------------------------

  const starClassName = `${size || DEFAULT_STAR_SIZE} shrink-0`;

  const stars = [];

  for (let i = 1; i <= STARS_COUNT; i++) {
    if (safeRating >= i) {
      // Full star
      stars.push(
        <BsStarFill key={i} className={`${starClassName} text-[#f4bc61]`} />,
      );
    } else if (safeRating >= i - 0.5) {
      // Half star
      stars.push(
        <BsStarHalf key={i} className={`${starClassName} text-[#f4bc61]`} />,
      );
    } else {
      // Empty star
      stars.push(
        <BsStarFill key={i} className={`${starClassName} text-[#7A7A7A]`} />,
      );
    }
  }

  // ----------------------------------------
  // Render
  // ----------------------------------------

  return (
    <div className="flex flex-row flex-wrap items-center gap-1 sm:gap-1.5 md:gap-2">
      {stars}
    </div>
  );
};

export default Stars;
