import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import connectDB from "@/lib/mongodb";
import Address from "@/models/Address.model";

const JWT_SECRET = process.env.SECRET_KEY;

if (!JWT_SECRET) {
  throw new Error("SECRET_KEY is missing in .env.local");
}

const secret = new TextEncoder().encode(JWT_SECRET);

// Get logged-in user ID
async function getAuthenticatedUserId(request) {
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    return payload?.userId || null;
  } catch (error) {
    console.error("JWT verification error:", error);
    return null;
  }
}

/*
|--------------------------------------------------------------------------
| GET /api/addresses
|--------------------------------------------------------------------------
| Get all addresses belonging to the logged-in user.
*/
export async function GET(request) {
  try {
    const userId = await getAuthenticatedUserId(request);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    await connectDB();

    const addresses = await Address.find({
      userId,
    }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    return NextResponse.json(
      {
        success: true,
        addresses,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get addresses error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while fetching addresses",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST /api/addresses
|--------------------------------------------------------------------------
| Add a new address for the logged-in user.
*/
export async function POST(request) {
  try {
    const userId = await getAuthenticatedUserId(request);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request data",
        },
        { status: 400 }
      );
    }

    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      addressType,
      isDefault,
    } = body || {};

    // Required fields
    if (
      !fullName ||
      !phone ||
      !addressLine1 ||
      !city ||
      !state ||
      !postalCode
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please fill all required fields",
        },
        { status: 400 }
      );
    }

    // Clean values
    const trimmedFullName = String(fullName).trim();
    const trimmedPhone = String(phone).trim();
    const trimmedAddressLine1 = String(addressLine1).trim();
    const trimmedAddressLine2 = addressLine2
      ? String(addressLine2).trim()
      : "";
    const trimmedCity = String(city).trim();
    const trimmedState = String(state).trim();
    const trimmedPostalCode = String(postalCode).trim();
    const trimmedCountry = country
      ? String(country).trim()
      : "India";

    const selectedAddressType =
      addressType === "Work" || addressType === "Other"
        ? addressType
        : "Home";

    // Validate phone
    const phoneRegex = /^[6-9][0-9]{9}$/;

    if (!phoneRegex.test(trimmedPhone)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid 10-digit Indian phone number",
        },
        { status: 400 }
      );
    }

    // Validate postal code
    const postalCodeRegex = /^[1-9][0-9]{5}$/;

    if (!postalCodeRegex.test(trimmedPostalCode)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid 6-digit postal code",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Check whether this is the user's first address
    const existingAddress = await Address.findOne({
      userId,
    });

    /*
     * If the user has no address yet,
     * automatically make the first address default.
     */
    const shouldBeDefault =
      !existingAddress || Boolean(isDefault);

    /*
     * If this address should become default,
     * remove default status from existing addresses.
     */
    if (shouldBeDefault) {
      await Address.updateMany(
        {
          userId,
          isDefault: true,
        },
        {
          $set: {
            isDefault: false,
          },
        }
      );
    }

    // Create address
    const newAddress = await Address.create({
      userId,
      fullName: trimmedFullName,
      phone: trimmedPhone,
      addressLine1: trimmedAddressLine1,
      addressLine2: trimmedAddressLine2,
      city: trimmedCity,
      state: trimmedState,
      postalCode: trimmedPostalCode,
      country: trimmedCountry || "India",
      addressType: selectedAddressType,
      isDefault: shouldBeDefault,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Address added successfully",
        address: newAddress,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add address error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while adding the address",
      },
      { status: 500 }
    );
  }
}