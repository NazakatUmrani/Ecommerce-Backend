import express from "express";
import { body } from "express-validator";
import multer from 'multer';
import { getAllProducts, getProductById } from "../Controllers/products.controller";

// Set up multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage }).array("photos", 5); // Limit to 5 images per product

const router = express.Router();

// Get all products: GET "/api/products". No Auth required
router.get("/", getAllProducts);

// Get product by id: GET "/api/products/:id". No Auth required
router.get("/:id", getProductById);

// Add a new product: POST "/api/products/add". Requires Auth
router.post(
  "/add",
  authenticate,
  upload,
  [
    body("title", "Title is required and must be at least 3 characters long").trim().isString().isLength({ min: 3 }),
    body("description", "Description must be a string").trim().isString().isLength({ min: 10 }),
    body("price", "Price must be a positive number").trim().isNumeric().isFloat({ gt: 0 }),
  ],
  addProduct
);

// Update a product: PUT "/api/products/update/:id". Requires Auth
router.put(
  "/update/:id",
  authenticate,
  upload,
  [
    body("title", "Title is required and must be at least 3 characters long").optional().trim().isString().isLength({ min: 3 }),
    body("price", "Price must be a positive number").optional().trim().isNumeric().isFloat({ gt: 0 }),
    body("description", "Description must be a string").optional().trim().isString(),
  ],
  updateProduct
);

// Delete a product: DELETE "/api/products/delete/:id". Requires Auth
router.delete("/delete/:id",authenticate, deleteProduct);


export default router;
