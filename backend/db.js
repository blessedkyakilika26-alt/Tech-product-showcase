const fs = require("fs");
const path = require("path");
const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");

require("dotenv").config();

const databasePath = path.resolve(
    __dirname,
    process.env.DB_FILE || "./products.db"
);

async function initializeDatabase() {
    const database = await sqlite.open({
        filename: databasePath,
        driver: sqlite3.Database
    });

    const schemaPath = path.join(__dirname, "schema.sql");

    const schema = fs.readFileSync(schemaPath, "utf8");

    await database.exec(schema);

    const result = await database.get(
        "SELECT COUNT(*) AS total FROM products"
    );

    if (result.total === 0) {
        const sampleProducts = [
            {
                product_name: "HP Laptop",
                brand: "HP",
                category: "Laptop",
                price: 9500,
                stock_quantity: 8,
                description: "Laptop for study and office work."
            },
            {
                product_name: "Dell Desktop",
                brand: "Dell",
                category: "Desktop",
                price: 12000,
                stock_quantity: 5,
                description: "Desktop computer for office use."
            },
            {
                product_name: "Samsung Smartphone",
                brand: "Samsung",
                category: "Smartphone",
                price: 4500,
                stock_quantity: 12,
                description: "Smartphone for everyday communication."
            },
            {
                product_name: "Lenovo ThinkPad",
                brand: "Lenovo",
                category: "Laptop",
                price: 11000,
                stock_quantity: 6,
                description: "Laptop suitable for productivity."
            },
            {
                product_name: "Logitech Wireless Mouse",
                brand: "Logitech",
                category: "Accessories",
                price: 350,
                stock_quantity: 20,
                description: "Wireless mouse for computers."
            },
            {
                product_name: "Canon Printer",
                brand: "Canon",
                category: "Printer",
                price: 2800,
                stock_quantity: 4,
                description: "Printer for home and office documents."
            },
            {
                product_name: "Apple iPad",
                brand: "Apple",
                category: "Tablet",
                price: 8500,
                stock_quantity: 7,
                description: "Tablet for reading and productivity."
            },
            {
                product_name: "Sony Headphones",
                brand: "Sony",
                category: "Accessories",
                price: 1200,
                stock_quantity: 10,
                description: "Headphones for listening to audio."
            },
            {
                product_name: "Acer Monitor",
                brand: "Acer",
                category: "Monitor",
                price: 3200,
                stock_quantity: 9,
                description: "Monitor for a desktop workstation."
            },
            {
                product_name: "External SSD",
                brand: "Kingston",
                category: "Storage",
                price: 1800,
                stock_quantity: 15,
                description: "Portable storage for files and backups."
            }
        ];

        const insertStatement = await database.prepare(`
            INSERT INTO products (
                product_name,
                brand,
                category,
                price,
                stock_quantity,
                description
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        try {
            for (const product of sampleProducts) {
                await insertStatement.run(
                    product.product_name,
                    product.brand,
                    product.category,
                    product.price,
                    product.stock_quantity,
                    product.description
                );
            }
        } finally {
            await insertStatement.finalize();
        }

        console.log("10 sample products inserted.");
    }

    console.log("SQLite database initialized.");

    return database;
}

module.exports = { initializeDatabase };