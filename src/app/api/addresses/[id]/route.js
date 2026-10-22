import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import connectDB from "@/lib/mongodb";
import Address from "@/models/Address.model";

const JWT_SECRET = process.env.SECRET_KEY;

if (!JWT_SECRET) {
  throw new Error("SECRET_KEY is missing in .env.local");
}

const secret = new TextEncoder().encode(JWT_SECRET);

/*
|--------------------------------------------------------------------------
| Get logged-in user ID
|--------------------------------------------------------------------------
*/
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
| Validate address data
|--------------------------------------------------------------------------
*/
function validateAddressData(body) {
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
  } = body || {};

  if (
    !fullName ||
    !phone ||
    !addressLine1 ||
    !city ||
    !state ||
    !postalCode
  ) {
    return {
      valid: false,
      message: "Please fill all required fields",
    };
  }

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

  if (trimmedFullName.length < 2) {
    return {
      valid: false,
      message: "Full name must be at least 2 characters",
    };
  }

  if (trimmedFullName.length > 50) {
    return {
      valid: false,
      message: "Full name must not exceed 50 characters",
    };
  }

  const phoneRegex = /^[6-9][0-9]{9}$/;

  if (!phoneRegex.test(trimmedPhone)) {
    return {
      valid: false,
      message: "Please enter a valid 10-digit Indian phone number",
    };
  }

  if (trimmedAddressLine1.length > 150) {
    return {
      valid: false,
      message: "Address must not exceed 150 characters",
    };
  }

  if (trimmedAddressLine2.length > 150) {
    return {
      valid: false,
      message: "Address Line 2 must not exceed 150 characters",
    };
  }

  if (trimmedCity.length > 50) {
    return {
      valid: false,
      message: "City must not exceed 50 characters",
    };
  }

  if (trimmedState.length > 50) {
    return {
      valid: false,
      message: "State must not exceed 50 characters",
    };
  }

  const postalCodeRegex = /^[1-9][0-9]{5}$/;

  if (!postalCodeRegex.test(trimmedPostalCode)) {
    return {
      valid: false,
      message: "Please enter a valid 6-digit postal code",
    };
  }

  return {
    valid: true,
    data: {
      fullName: trimmedFullName,
      phone: trimmedPhone,
      addressLine1: trimmedAddressLine1,
      addressLine2: trimmedAddressLine2,
      city: trimmedCity,
      state: trimmedState,
      postalCode: trimmedPostalCode,
      country: trimmedCountry || "India",
      addressType: selectedAddressType,
    },
  };
}

/*
|--------------------------------------------------------------------------
| PUT /api/addresses/[id]
|--------------------------------------------------------------------------
| Update an existing address.
|
| Also supports making the address default.
|--------------------------------------------------------------------------
*/
export async function PUT(request, { params }) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Address ID is required",
        },
        { status: 400 }
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

    await connectDB();

    /*
     * First check that the address belongs to
     * the currently logged-in user.
     */
    const existingAddress = await Address.findOne({
      _id: id,
      userId,
    });

    if (!existingAddress) {
      return NextResponse.json(
        {
          success: false,
          message: "Address not found",
        },
        { status: 404 }
      );
    }

    /*
     * If the request only wants to change
     * the default status.
     */
    const isDefaultOnlyRequest =
      Object.keys(body || {}).length === 1 &&
      typeof body?.isDefault === "boolean";

    if (isDefaultOnlyRequest) {
      if (body.isDefault === true) {
        /*
         * Remove default status from all
         * other addresses.
         */
        await Address.updateMany(
          {
            userId,
            _id: { $ne: id },
            isDefault: true,
          },
          {
            $set: {
              isDefault: false,
            },
          }
        );

        existingAddress.isDefault = true;
      } else {
        /*
         * Don't allow the user to remove the
         * default status if this is the only
         * default address.
         */
        const otherAddress = await Address.findOne({
          userId,
          _id: { $ne: id },
        });

        if (!otherAddress) {
          return NextResponse.json(
            {
              success: false,
              message:
                "You must keep at least one address as default",
            },
            { status: 400 }
          );
        }

        /*
         * Make another address default.
         */
        const newDefaultAddress = await Address.findOne({
          userId,
          _id: { $ne: id },
        }).sort({
          createdAt: -1,
        });

        if (newDefaultAddress) {
          newDefaultAddress.isDefault = true;
          await newDefaultAddress.save();
        }

        existingAddress.isDefault = false;
      }

      await existingAddress.save();

      return NextResponse.json(
        {
          success: true,
          message: body.isDefault
            ? "Default address updated successfully"
            : "Default address changed successfully",
          address: existingAddress,
        },
        { status: 200 }
      );
    }

    /*
     * Normal address update.
     */
    const validation = validateAddressData(body);

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: validation.message,
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
    } = validation.data;

    const isDefault = Boolean(body?.isDefault);

    /*
     * If this address is being made default,
     * remove default from all other addresses.
     */
    if (isDefault) {
      await Address.updateMany(
        {
          userId,
          _id: { $ne: id },
          isDefault: true,
        },
        {
          $set: {
            isDefault: false,
          },
        }
      );
    }

    /*
     * If the existing address is default and
     * user tries to remove default while
     * other addresses exist, assign another
     * address as default.
     */
    let finalIsDefault = isDefault;

    if (!isDefault && existingAddress.isDefault) {
      const otherAddress = await Address.findOne({
        userId,
        _id: { $ne: id },
      }).sort({
        createdAt: -1,
      });

      if (otherAddress) {
        otherAddress.isDefault = true;
        await otherAddress.save();

        finalIsDefault = false;
      } else {
        finalIsDefault = true;
      }
    }

    existingAddress.fullName = fullName;
    existingAddress.phone = phone;
    existingAddress.addressLine1 = addressLine1;
    existingAddress.addressLine2 = addressLine2;
    existingAddress.city = city;
    existingAddress.state = state;
    existingAddress.postalCode = postalCode;
    existingAddress.country = country;
    existingAddress.addressType = addressType;
    existingAddress.isDefault = finalIsDefault;

    await existingAddress.save();

    return NextResponse.json(
      {
        success: true,
        message: "Address updated successfully",
        address: existingAddress,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update address error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while updating the address",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE /api/addresses/[id]
|--------------------------------------------------------------------------
| Delete an address belonging to the logged-in user.
|--------------------------------------------------------------------------
*/
export async function DELETE(request, { params }) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Address ID is required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    /*
     * Find only an address that belongs
     * to the logged-in user.
     */
    const address = await Address.findOne({
      _id: id,
      userId,
    });

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          message: "Address not found",
        },
        { status: 404 }
      );
    }

    const wasDefault = address.isDefault;

    /*
     * Delete the address.
     */
    await Address.deleteOne({
      _id: id,
      userId,
    });

    /*
     * If the deleted address was the default,
     * automatically make another address default.
     */
    if (wasDefault) {
      const nextDefaultAddress = await Address.findOne({
        userId,
      }).sort({
        createdAt: -1,
      });

      if (nextDefaultAddress) {
        nextDefaultAddress.isDefault = true;
        await nextDefaultAddress.save();
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Address deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete address error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while deleting the address",
      },
      { status: 500 }
    );
  }
}