// LIM YIH FEI, A0256993J

import mongoose from "mongoose";
import dotenv from "dotenv";
import colors from "colors";
import productModel from "./models/productModel.js";
import categoryModel from "./models/categoryModel.js";

dotenv.config();

const SEED_COUNT = 10000;

const seedDB = async () => {
  try {
    console.log("Connecting to Database...".yellow);
    const conn = await mongoose.connect(process.env.MONGO_URL);
    console.log(`Connected To Mongodb Database: ${conn.connection.host}`.bgMagenta.white);
    
    console.log("Clearing old volume test data (if any)...".yellow);
    await productModel.deleteMany({ name: { $regex: /^Volume Test Product/ } });
    await categoryModel.deleteMany({ slug: "volume-test-category" });

    console.log("Creating dummy category...".yellow);
    const category = await new categoryModel({
      name: "Volume Test Category",
      slug: "volume-test-category",
    }).save();

    console.log(`Generating ${SEED_COUNT} volume-testing products... This may take a minute.`.yellow);
    
    const products = [];
    for (let i = 0; i < SEED_COUNT; i++) {
      products.push({
        name: `Volume Test Product ${i}`,
        slug: `volume-test-product-${i}`,
        description: "This is a dummy product purely used for volume & load testing purposes so we can hit the search endpoint massively.",
        price: 99.99,
        category: category._id,
        quantity: 100,
        shipping: true,
      });
    }

    console.log(`Inserting ${SEED_COUNT} products into database in one batch...`.yellow);
    await productModel.insertMany(products);
    
    console.log(`Successfully seeded ${SEED_COUNT} volume testing products!`.green);
    process.exit(0);
  } catch (error) {
    console.error(`Error with seeding: ${error}`.bgRed.white);
    process.exit(1);
  }
};

seedDB();
