// FILE LOCATION: src/models/User.model.js

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    // ============================================================
    // USER NAME
    // ============================================================

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [30, "Name must not exceed 30 characters"],
    },

    // ============================================================
    // EMAIL
    // ============================================================
    //
    // Email is required and unique (partial index below).
    // Email verification is confirmed via a clickable link.
    //
    // ============================================================

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      maxlength: [50, "Email must not exceed 50 characters"],
    },

    // ============================================================
    // PHONE (OPTIONAL)
    // ============================================================
    //
    // Phone is optional. Users signing up via the website only
    // provide name, email, and password.
    //
    // Existing users may still have a phone on record, and the
    // partial unique index below prevents duplicate phones
    // whenever a phone is present.
    //
    // ============================================================

    phone: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },

    // ============================================================
    // EMAIL VERIFICATION
    // ============================================================

    emailVerified: {
      type: Boolean,
      default: false,
    },

    // ============================================================
    // PASSWORD
    // ============================================================
    // Password is stored as a bcrypt hash.

    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },

    // ============================================================
    // USER ROLE
    // ============================================================

    role: {
      type: String,
      required: true,
      enum: ["user", "admin"],
      default: "user",
    },

    // ============================================================
    // SOFT DELETE
    // ============================================================

    deletedAt: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,

    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;

        return ret;
      },
    },
  }
);

// ============================================================
// PARTIAL UNIQUE EMAIL INDEX
// ============================================================
//
// Enforces email uniqueness only when email is a string.
// Soft-deleted users keep their email, so this stays correct.
//
// ============================================================

userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      email: { $type: "string" },
    },
  }
);

// ============================================================
// PARTIAL UNIQUE PHONE INDEX
// ============================================================
//
// Enforces phone uniqueness only when phone is a real string.
//
// New users who sign up without a phone will have `phone: null`,
// which is NOT a string, so the index skips them entirely.
// This lets multiple users coexist without a phone.
//
// ============================================================

userSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: {
      phone: { $type: "string" },
    },
  }
);

// ============================================================
// PASSWORD HASHING
// ============================================================
//
// Only hashes when the password field is modified.
// This means a User created via `.collection.insertOne()`
// (as the verify-email flow does) will NOT be re-hashed here.
//
// ============================================================

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

// ============================================================
// PASSWORD COMPARISON
// ============================================================

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ============================================================
// MODEL
// ============================================================

const UserModel =
  mongoose.models.User ||
  mongoose.model("User", userSchema, "users");

export default UserModel;