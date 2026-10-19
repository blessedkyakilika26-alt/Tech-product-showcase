const express = require("express");
const cors = require("cors");

require("dotenv").config();

const { initializeDatabase } = require("./db");

const app = express();

const PORT = process.env.PORT || 3000;

let db;

app.use(cors());
app.use(express.json());

// Check that the API is running.
app.get("/", (req, res) => {
    res.json({
        message: "Tech Product Showcase API is running."
    });
});

// GET: Retrieve all products.
app.get("/api/products", async (req, res, next) => {
    try {
        const products = await db.all(
            "SELECT * FROM products ORDER BY id ASC"
        );

        res.json(products);
    } catch (error) {
        next(error);
    }
});

// GET: Retrieve one product by ID.
app.get("/api/products/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error: "A valid positive product ID is required."
            });
        }

        const product = await db.get(
            "SELECT * FROM products WHERE id = ?",
            [id]
        );

        if (!product) {
            return res.status(404).json({
                error: "Product not found."
            });
        }

        res.json(product);
    } catch (error) {
        next(error);
    }
});

// POST: Create a product.
app.post("/api/products", async (req, res, next) => {
    try {
        const {
            product_name,
            brand,
            category,
            price,
            stock_quantity,
            description
        } = req.body;

        if (
            typeof product_name !== "string" ||
            !product_name.trim() ||
            typeof brand !== "string" ||
            !brand.trim() ||
            typeof category !== "string" ||
            !category.trim()
        ) {
            return res.status(400).json({
                error: "Product name, brand and category are required."
            });
        }

        const numericPrice = Number(price);
        const numericStock = Number(stock_quantity);

        if (
            price === undefined ||
            price === null ||
            price === "" ||
            !Number.isFinite(numericPrice) ||
            numericPrice < 0
        ) {
            return res.status(400).json({
                error: "Price must be a non-negative number."
            });
        }

        if (
            stock_quantity === undefined ||
            stock_quantity === null ||
            stock_quantity === "" ||
            !Number.isInteger(numericStock) ||
            numericStock < 0
        ) {
            return res.status(400).json({
                error: "Stock quantity must be a non-negative integer."
            });
        }

        if (
            description !== undefined &&
            description !== null &&
            typeof description !== "string"
        ) {
            return res.status(400).json({
                error: "Description must be text."
            });
        }

        const result = await db.run(
            `INSERT INTO products (
                product_name,
                brand,
                category,
                price,
                stock_quantity,
                description
            )
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                product_name.trim(),
                brand.trim(),
                category.trim(),
                numericPrice,
                numericStock,
                description == null ? null : description.trim()
            ]
        );

        const newProduct = await db.get(
            "SELECT * FROM products WHERE id = ?",
            [result.lastID]
        );

        res.status(201).json(newProduct);
    } catch (error) {
        next(error);
    }
});

// PUT: Update an existing product.
app.put("/api/products/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error: "A valid positive product ID is required."
            });
        }

        const existingProduct = await db.get(
            "SELECT * FROM products WHERE id = ?",
            [id]
        );

        if (!existingProduct) {
            return res.status(404).json({
                error: "Product not found."
            });
        }

        const {
            product_name,
            brand,
            category,
            price,
            stock_quantity,
            description
        } = req.body;

        const updated = {
            product_name:
                product_name === undefined
                    ? existingProduct.product_name
                    : product_name,
            brand:
                brand === undefined
                    ? existingProduct.brand
                    : brand,
            category:
                category === undefined
                    ? existingProduct.category
                    : category,
            price:
                price === undefined
                    ? existingProduct.price
                    : price,
            stock_quantity:
                stock_quantity === undefined
                    ? existingProduct.stock_quantity
                    : stock_quantity,
            description:
                description === undefined
                    ? existingProduct.description
                    : description
        };

        if (
            typeof updated.product_name !== "string" ||
            !updated.product_name.trim() ||
            typeof updated.brand !== "string" ||
            !updated.brand.trim() ||
            typeof updated.category !== "string" ||
            !updated.category.trim()
        ) {
            return res.status(400).json({
                error: "Product name, brand and category are required."
            });
        }

        const numericPrice = Number(updated.price);
        const numericStock = Number(updated.stock_quantity);

        if (
            updated.price === null ||
            updated.price === "" ||
            !Number.isFinite(numericPrice) ||
            numericPrice < 0
        ) {
            return res.status(400).json({
                error: "Price must be a non-negative number."
            });
        }

        if (
            updated.stock_quantity === null ||
            updated.stock_quantity === "" ||
            !Number.isInteger(numericStock) ||
            numericStock < 0
        ) {
            return res.status(400).json({
                error: "Stock quantity must be a non-negative integer."
            });
        }

        if (
            updated.description !== null &&
            typeof updated.description !== "string"
        ) {
            return res.status(400).json({
                error: "Description must be text or null."
            });
        }

        await db.run(
            `UPDATE products
             SET product_name = ?,
                 brand = ?,
                 category = ?,
                 price = ?,
                 stock_quantity = ?,
                 description = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                updated.product_name.trim(),
                updated.brand.trim(),
                updated.category.trim(),
                numericPrice,
                numericStock,
                updated.description === null
                    ? null
                    : updated.description.trim(),
                id
            ]
        );

        const updatedProduct = await db.get(
            "SELECT * FROM products WHERE id = ?",
            [id]
        );

        res.json(updatedProduct);
    } catch (error) {
        next(error);
    }
});

// DELETE: Remove a product.
app.delete("/api/products/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error: "A valid positive product ID is required."
            });
        }

        const result = await db.run(
            "DELETE FROM products WHERE id = ?",
            [id]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                error: "Product not found."
            });
        }

        res.json({
            message: "Product deleted successfully.",
            id
        });
    } catch (error) {
        next(error);
    }
});

// Handle unexpected server errors.
app.use((error, req, res, next) => {
    console.error(error);

    res.status(500).json({
        error: "An internal server error occurred."
    });
});

// Initialize the database before starting the server.
async function startServer() {
    try {
        db = await initializeDatabase();

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
            console.log(`Products API: http://localhost:${PORT}/api/products`);
        });
    } catch (error) {
        console.error("Failed to start the server:", error);
        process.exit(1);
    }
}

startServer();