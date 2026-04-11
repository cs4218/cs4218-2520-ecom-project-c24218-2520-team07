/**
 * Seed script for stress test
 * Imports categories, products, and a test user from the Canvas sample DB schema.
 * Photos are omitted to keep the script fast and the focus on concurrency.
 *
 * Usage:  node nft/seed-stress.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// ── Inline schemas ────────────────────────────────────────────────────────────

const categorySchema = new mongoose.Schema({ name: String, slug: String });
const Category = mongoose.model("Category", categorySchema, "categories");

const productSchema = new mongoose.Schema({
  name: String,
  slug: String,
  description: String,
  price: Number,
  category: mongoose.Schema.Types.ObjectId,
  quantity: Number,
  shipping: Boolean,
});
const Product = mongoose.model("Product", productSchema, "products");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,
  address: String,
  answer: String,
  role: Number,
});
const User = mongoose.model("User", userSchema, "users");

// ── Seed data (from Canvas sample DB schema) ──────────────────────────────────

const CATEGORIES = [
  { _id: new mongoose.Types.ObjectId("66db427fdb0119d9234b27ed"), name: "Electronics", slug: "electronics" },
  { _id: new mongoose.Types.ObjectId("66db427fdb0119d9234b27ef"), name: "Book",         slug: "book"        },
  { _id: new mongoose.Types.ObjectId("66db427fdb0119d9234b27ee"), name: "Clothing",     slug: "clothing"    },
];

const ELECTRONICS = new mongoose.Types.ObjectId("66db427fdb0119d9234b27ed");
const BOOK        = new mongoose.Types.ObjectId("66db427fdb0119d9234b27ef");
const CLOTHING    = new mongoose.Types.ObjectId("66db427fdb0119d9234b27ee");

const PRODUCTS = [
  { _id: new mongoose.Types.ObjectId("66db427fdb0119d9234b27f1"), name: "Textbook",   slug: "textbook",   description: "A comprehensive textbook",        price: 79.99,   category: BOOK,        quantity: 50,  shipping: false },
  { _id: new mongoose.Types.ObjectId("66db427fdb0119d9234b27f3"), name: "Laptop",     slug: "laptop",     description: "A powerful laptop",               price: 1499.99, category: ELECTRONICS, quantity: 30,  shipping: true  },
  { _id: new mongoose.Types.ObjectId("66db427fdb0119d9234b27f5"), name: "Smartphone", slug: "smartphone", description: "A high-end smartphone",            price: 999.99,  category: ELECTRONICS, quantity: 50,  shipping: false },
  { _id: new mongoose.Types.ObjectId("66db427fdb0119d9234b27f9"), name: "Novel",      slug: "novel",      description: "A bestselling novel",             price: 14.99,   category: BOOK,        quantity: 200, shipping: true  },
  { _id: new mongoose.Types.ObjectId("67a2171ea6d9e00ef2ac0229"), name: "The Law of Contract in Singapore", slug: "the-law-of-contract-in-singapore", description: "A bestselling book in Singapore", price: 54.99, category: BOOK, quantity: 200, shipping: true },
  { _id: new mongoose.Types.ObjectId("67a21772a6d9e00ef2ac022a"), name: "NUS T-shirt", slug: "nus-tshirt", description: "Plain NUS T-shirt for sale",      price: 4.99,    category: CLOTHING,    quantity: 200, shipping: true  },
  { name: "Smart Watch",      slug: "smart-watch",      description: "Fitness tracker and smartwatch",   price: 199.99,  category: ELECTRONICS, quantity: 120, shipping: true  },
  { name: "Wireless Earbuds", slug: "wireless-earbuds", description: "Noise cancelling earbuds",         price: 89.99,   category: ELECTRONICS, quantity: 80,  shipping: true  },
  { name: "Running Shoes",    slug: "running-shoes",    description: "Lightweight shoes for daily runs", price: 129.99,  category: CLOTHING,    quantity: 150, shipping: true  },
  { name: "Design Patterns",  slug: "design-patterns",  description: "Classic software patterns book",   price: 59.99,   category: BOOK,        quantity: 60,  shipping: true  },
];

// ── Seed function ─────────────────────────────────────────────────────────────

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");

    // Wipe existing data
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log("Cleared existing categories and products");

    // Insert categories
    await Category.insertMany(CATEGORIES);
    console.log(`Inserted ${CATEGORIES.length} categories`);

    // Insert products
    const inserted = await Product.insertMany(PRODUCTS);
    console.log(`Inserted ${inserted.length} products`);

    // Ensure stress-test user exists (won't overwrite if already created)
    const existingUser = await User.findOne({ email: "nft.stress.cleon@test.com" });
    if (!existingUser) {
      // Pre-hashed password so we don't depend on bcrypt at seed time.
      // The stress test logs in with STRESS_USER_PASSWORD = "StressTest123!"
      // This bcrypt hash matches that password (cost 10).
      await User.create({
        name:     "NFT Stress Tester",
        email:    "nft.stress.cleon@test.com",
        password: "$2b$10$qydp7.8e1YqqehiUijOyfu.efmWtlyU1EyC.QgiBFs6R9YFpp93Z2",
        phone:    "00000000",
        address:  "1 Stress Test Road",
        answer:   "nft",
        role:     0,
      });
      console.log("Created stress-test user");
    } else {
      console.log("Stress-test user already exists — skipped");
    }

    console.log("\nSeed complete. Database is ready for stress testing.");
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
