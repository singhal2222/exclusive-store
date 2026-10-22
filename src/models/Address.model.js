import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },

    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [50, "Full name must not exceed 50 characters"],
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [
        /^[6-9][0-9]{9}$/,
        "Please enter a valid 10-digit Indian phone number",
      ],
    },

    addressLine1: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      maxlength: [150, "Address must not exceed 150 characters"],
    },

    addressLine2: {
      type: String,
      trim: true,
      maxlength: [150, "Address must not exceed 150 characters"],
      default: "",
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      maxlength: [50, "City must not exceed 50 characters"],
    },

    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      maxlength: [50, "State must not exceed 50 characters"],
    },

    postalCode: {
      type: String,
      required: [true, "Postal code is required"],
      trim: true,
      match: [
        /^[1-9][0-9]{5}$/,
        "Please enter a valid 6-digit postal code",
      ],
    },

    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
      default: "India",
    },

    addressType: {
      type: String,
      enum: ["Home", "Work", "Other"],
      default: "Home",
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const AddressModel =
  mongoose.models.Address ||
  mongoose.model("Address", addressSchema, "addresses");

export default AddressModel;