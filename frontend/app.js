const API_URL = "http://localhost:3000/api/products";

const productForm = document.getElementById("product-form");
const tableBody = document.getElementById("products-table-body");
const messageElement = document.getElementById("message");
const formTitle = document.getElementById("form-title");
const submitButton = document.getElementById("submit-button");
const cancelButton = document.getElementById("cancel-button");

let editingProductId = null;

function showMessage(message, type = "success") {
    messageElement.textContent = message;
    messageElement.className = type;
}

function clearMessage() {
    messageElement.textContent = "";
    messageElement.className = "";
}

function resetForm() {
    productForm.reset();
    editingProductId = null;

    formTitle.textContent = "Add a New Product";
    submitButton.textContent = "Add Product";
    cancelButton.hidden = true;
}

async function requestJSON(url, options = {}) {
    const response = await fetch(url, options);

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "The request failed.");
    }

    return data;
}

async function loadProducts() {
    try {
        const products = await requestJSON(API_URL);

        tableBody.replaceChildren();

        if (products.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 8;
            cell.textContent = "No products found.";

            row.appendChild(cell);
            tableBody.appendChild(row);

            return;
        }

        for (const product of products) {
            const row = document.createElement("tr");

            const values = [
                product.id,
                product.product_name,
                product.brand,
                product.category,
                `ZMW ${Number(product.price).toFixed(2)}`,
                product.stock_quantity,
                product.description || ""
            ];

            for (const value of values) {
                const cell = document.createElement("td");

                // Use textContent instead of inserting HTML.
                cell.textContent = String(value);

                row.appendChild(cell);
            }

            const actionsCell = document.createElement("td");

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.textContent = "Edit";
            editButton.className = "edit-button";

            editButton.addEventListener("click", () => {
                editProduct(product);
            });

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.textContent = "Delete";
            deleteButton.className = "delete-button";

            deleteButton.addEventListener("click", () => {
                deleteProduct(product.id);
            });

            actionsCell.append(editButton, deleteButton);
            row.appendChild(actionsCell);

            tableBody.appendChild(row);
        }
    } catch (error) {
        showMessage(
            `Could not load products: ${error.message}`,
            "error"
        );
    }
}

productForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearMessage();

    const product = {
        product_name: document.getElementById("product_name").value.trim(),
        brand: document.getElementById("brand").value.trim(),
        category: document.getElementById("category").value.trim(),
        price: Number(document.getElementById("price").value),
        stock_quantity: Number(
            document.getElementById("stock_quantity").value
        ),
        description: document.getElementById("description").value.trim()
    };

    if (
        !product.product_name ||
        !product.brand ||
        !product.category
    ) {
        showMessage(
            "Please enter the product name, brand and category.",
            "error"
        );

        return;
    }

    if (
        document.getElementById("price").value === "" ||
        !Number.isFinite(product.price) ||
        product.price < 0
    ) {
        showMessage("Enter a valid non-negative price.", "error");
        return;
    }

    if (
        document.getElementById("stock_quantity").value === "" ||
        !Number.isInteger(product.stock_quantity) ||
        product.stock_quantity < 0
    ) {
        showMessage(
            "Enter a valid non-negative whole-number stock quantity.",
            "error"
        );

        return;
    }

    try {
        if (editingProductId === null) {
            await requestJSON(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(product)
            });

            showMessage("Product added successfully.");
        } else {
            await requestJSON(`${API_URL}/${editingProductId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(product)
            });

            showMessage("Product updated successfully.");
        }

        resetForm();

        await loadProducts();
    } catch (error) {
        showMessage(error.message, "error");
    }
});

function editProduct(product) {
    clearMessage();

    editingProductId = product.id;

    document.getElementById("product_name").value =
        product.product_name;

    document.getElementById("brand").value =
        product.brand;

    document.getElementById("category").value =
        product.category;

    document.getElementById("price").value =
        product.price;

    document.getElementById("stock_quantity").value =
        product.stock_quantity;

    document.getElementById("description").value =
        product.description || "";

    formTitle.textContent = `Edit Product #${product.id}`;
    submitButton.textContent = "Save Changes";
    cancelButton.hidden = false;

    productForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

async function deleteProduct(id) {
    const confirmed = window.confirm(
        `Are you sure you want to delete product #${id}?`
    );

    if (!confirmed) {
        return;
    }

    clearMessage();

    try {
        await requestJSON(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (editingProductId === id) {
            resetForm();
        }

        showMessage("Product deleted successfully.");

        await loadProducts();
    } catch (error) {
        showMessage(error.message, "error");
    }
}

cancelButton.addEventListener("click", () => {
    resetForm();
    clearMessage();
});

loadProducts();