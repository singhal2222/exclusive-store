import dotenv from "dotenv";
import mongoose from "mongoose";
import UserModel from "../src/models/User.model.js";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_NAME = process.env.ADMIN_NAME;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// ============================================================
// ENVIRONMENT VARIABLE VALIDATION
// ============================================================

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is missing");
}

if (!ADMIN_NAME) {
  throw new Error("ADMIN_NAME is missing");
}

if (!ADMIN_EMAIL) {
  throw new Error("ADMIN_EMAIL is missing");
}

if (!ADMIN_PASSWORD) {
  throw new Error("ADMIN_PASSWORD is missing");
}

// ============================================================
// SEED ADMIN
// ============================================================

async function seedAdmin() {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(MONGODB_URI);

    console.log("MongoDB connected successfully.");

    const email = ADMIN_EMAIL.toLowerCase().trim();

    // ============================================================
    // CHECK WHETHER ADMIN ALREADY EXISTS
    // ============================================================

    const existingAdmin = await UserModel.findOne({
      email,
      role: "admin",
    }).select("+password");

    // ============================================================
    // UPDATE EXISTING ADMIN
    // ============================================================

    if (existingAdmin) {
      console.log("Admin already exists. Updating admin details...");

      existingAdmin.name = ADMIN_NAME;
      existingAdmin.password = ADMIN_PASSWORD;

      await existingAdmin.save();

      console.log("Admin updated successfully.");

      console.log("----------------------------------------");
      console.log("Admin ID:", existingAdmin._id.toString());
      console.log("Admin Name:", existingAdmin.name);
      console.log("Admin Email:", existingAdmin.email);
      console.log("Admin Role:", existingAdmin.role);
      console.log("----------------------------------------");
    }

    // ============================================================
    // CREATE NEW ADMIN
    // ============================================================

    else {
      console.log("Admin does not exist. Creating admin...");

      const admin = await UserModel.create({
        name: ADMIN_NAME,
        email,
        password: ADMIN_PASSWORD,
        role: "admin",
      });

      console.log("Admin created successfully.");

      console.log("----------------------------------------");
      console.log("Admin ID:", admin._id.toString());
      console.log("Admin Name:", admin.name);
      console.log("Admin Email:", admin.email);
      console.log("Admin Role:", admin.role);
      console.log("----------------------------------------");
    }

    console.log("Admin setup completed successfully.");
  } catch (error) {
    console.error("Admin setup failed:");
    console.error(error);

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();

    console.log("MongoDB connection closed.");
  }
}

// ============================================================
// RUN SCRIPT
// ============================================================

seedAdmin();