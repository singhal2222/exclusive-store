// FILE LOCATION: scripts/recalculateRatings.mjs

import mongoose from "mongoose";
import dotenv from "dotenv";

// ============================================================
// ENV LOADING
// ============================================================
//
// The dev server loads `.env.local`, but this standalone script
// needs to do it explicitly. We try `.env.local` first, then
// fall back to `.env` if needed.
//
// ============================================================

dotenv.config({ path: ".env.local" });
dotenv.config(); // fallback: also loads `.env` if present

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error(
        "\n❌ MONGODB_URI is not set. Please add it to .env.local and try again.\n"
    );
    process.exit(1);
}

// ============================================================
// SCHEMAS (MINIMAL, SCRIPT-LOCAL)
// ============================================================
//
// We deliberately define minimal schemas here instead of
// importing from src/models/. This keeps the script
// self-contained and immune to schema changes that might
// break historical data. We only need the fields we touch.
//
// ============================================================

const ProductSchema = new mongoose.Schema(
    {
        name: String,
        rating: Number,
        reviewCount: Number,
    },
    {
        timestamps: true,
        collection: "products",
        strict: false, // do not enforce schema, we only read/write a subset
    }
);

const ReviewSchema = new mongoose.Schema(
    {
        product: mongoose.Schema.Types.ObjectId,
        status: String,
        rating: Number,
    },
    {
        collection: "reviews",
        strict: false,
    }
);

const Product =
    mongoose.models.ScriptProduct ||
    mongoose.model("ScriptProduct", ProductSchema);

const Review =
    mongoose.models.ScriptReview ||
    mongoose.model("ScriptReview", ReviewSchema);

// ============================================================
// MAIN LOGIC
// ============================================================

async function recalculateAllProductRatings() {
    console.log("\n🔄 Starting product rating recalculation...\n");

    // ----------------------------------------
    // Step 1 — Load all products
    // ----------------------------------------

    const products = await Product.find({})
        .select("_id name rating reviewCount")
        .lean();

    console.log(`📦 Found ${products.length} products to process.\n`);

    if (products.length === 0) {
        console.log("Nothing to do. Exiting.\n");
        return {
            totalProducts: 0,
            changed: 0,
            unchanged: 0,
            errors: 0,
        };
    }

    // ----------------------------------------
    // Step 2 — Aggregate approved reviews per product
    // ----------------------------------------
    //
    // One aggregation query computes the count and average
    // for every product that has at least one approved review.
    //
    // ----------------------------------------

    const aggregates = await Review.aggregate([
        {
            $match: {
                status: "approved",
            },
        },
        {
            $group: {
                _id: "$product",
                average: { $avg: "$rating" },
                count: { $sum: 1 },
            },
        },
    ]);

    // Build a Map for quick lookup: productId (string) -> {average, count}
    const aggregateMap = new Map();

    for (const row of aggregates) {
        if (!row?._id) continue;

        aggregateMap.set(row._id.toString(), {
            average: row.average || 0,
            count: row.count || 0,
        });
    }

    console.log(
        `📊 Found ${aggregateMap.size} products with approved reviews.\n`
    );

    // ----------------------------------------
    // Step 3 — Update each product
    // ----------------------------------------

    let changed = 0;
    let unchanged = 0;
    let errors = 0;

    for (const product of products) {
        try {
            const productId = product._id.toString();

            const aggregate = aggregateMap.get(productId);

            const newRating = aggregate
                ? Number(aggregate.average.toFixed(1))
                : 0;

            const newCount = aggregate ? aggregate.count : 0;

            const oldRating = Number(product.rating || 0);
            const oldCount = Number(product.reviewCount || 0);

            const ratingChanged = oldRating !== newRating;
            const countChanged = oldCount !== newCount;

            if (!ratingChanged && !countChanged) {
                unchanged += 1;
                continue;
            }

            // Use updateOne with $set to avoid document validation
            // on other fields we did not touch.
            await Product.updateOne(
                { _id: product._id },
                {
                    $set: {
                        rating: newRating,
                        reviewCount: newCount,
                    },
                }
            );

            changed += 1;

            console.log(
                `   ✅ ${product.name || "(unnamed)"} — ` +
                `rating ${oldRating} → ${newRating}, ` +
                `count ${oldCount} → ${newCount}`
            );
        } catch (error) {
            errors += 1;

            console.error(
                `   ❌ Failed to update ${product.name || "(unnamed)"} ` +
                `(${product._id}):`,
                error?.message || error
            );
        }
    }

    // ----------------------------------------
    // Summary
    // ----------------------------------------

    console.log("\n" + "=".repeat(60));
    console.log("✅ Recalculation complete");
    console.log("=".repeat(60));
    console.log(`   Total products:  ${products.length}`);
    console.log(`   Changed:         ${changed}`);
    console.log(`   Unchanged:       ${unchanged}`);
    console.log(`   Errors:          ${errors}`);
    console.log("=".repeat(60) + "\n");

    return {
        totalProducts: products.length,
        changed,
        unchanged,
        errors,
    };
}

// ============================================================
// ENTRY POINT
// ============================================================

async function main() {
    try {
        console.log("\n🔌 Connecting to MongoDB...");

        await mongoose.connect(MONGODB_URI, {
            // Short timeout so the script fails fast if it cannot
            // reach the database.
            serverSelectionTimeoutMS: 10000,
        });

        console.log("🔗 Connected successfully.\n");

        await recalculateAllProductRatings();
    } catch (error) {
        console.error("\n❌ Fatal error:", error?.message || error);
        process.exitCode = 1;
    } finally {
        // Always disconnect cleanly so the Node process exits.
        await mongoose.disconnect();
        console.log("🔌 Disconnected from MongoDB.\n");
    }
}

main();