import { Suspense } from "react";
import Products from "@/components/products/Products";

function ShopLoading() {
  return (
    <section className="w-full bg-white py-12 font-poppins">
      <div className="mx-auto max-w-6xl px-4">
        <div className="animate-pulse">

          {/* Breadcrumb skeleton */}

          <div className="mb-10 h-4 w-40 rounded bg-gray-200" />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">

            {/* Sidebar skeleton */}

            <div className="hidden lg:block">
              <div className="h-6 w-32 rounded bg-gray-200" />

              <div className="mt-6 space-y-4">
                {[1, 2, 3, 4, 5, 6].map(
                  (item) => (
                    <div
                      key={item}
                      className="h-5 w-36 rounded bg-gray-200"
                    />
                  )
                )}
              </div>
            </div>

            {/* Products skeleton */}

            <div>
              <div className="mb-8 flex items-center justify-between">
                <div className="h-8 w-44 rounded bg-gray-200" />

                <div className="h-10 w-28 rounded bg-gray-200" />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(
                  (item) => (
                    <div key={item}>
                      <div className="h-72 rounded-md bg-gray-200" />

                      <div className="mt-4 h-5 w-40 rounded bg-gray-200" />

                      <div className="mt-3 h-4 w-24 rounded bg-gray-200" />
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopLoading />}>
      <Products />
    </Suspense>
  );
}
