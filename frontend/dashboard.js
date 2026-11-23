
const API_URL = "http://127.0.0.1:8000";

const token = sessionStorage.getItem("access_token");

const productForm = document.getElementById("product-form");
const productTableBody = document.getElementById("product-table-body");
const productMessage = document.getElementById("product-message");
const emptyMessage = document.getElementById("empty-message");
const formHeading = document.getElementById("form-heading");
const saveBtn = document.getElementById("save-btn");
const cancelBtn = document.getElementById("cancel-btn");

let isEditing = false;

if (!token) {
    window.location.href = "index.html";
}


async function apiRequest(url, method = "GET", body = null) {

    const options = {
        method: method,
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(API_URL + url, options);

    const data = await response.json();

    if (response.status === 401) {
        sessionStorage.removeItem("access_token");
        window.location.href = "index.html";
        throw new Error("Your session has expired. Please login again.");
    }

    if (!response.ok) {
        throw new Error(data.detail || data.message || "Request failed");
    }

    return data;
}


// Load Logged-in User Details
async function loadUserDetails() {

    try {

        const user = await apiRequest("/me");

        document.getElementById("user-name").textContent = user.name;
        document.getElementById("user-email").textContent = user.email;

    } catch (error) {

        productMessage.textContent = error.message;
        productMessage.style.color = "red";

    }
}


async function loadProducts() {

    productMessage.textContent = "";

    try {

        const products = await apiRequest("/product");

        productTableBody.innerHTML = "";

        if (products.length === 0) {
            emptyMessage.textContent = "No products available.";
            return;
        }

        emptyMessage.textContent = "";

        products.forEach(product => {

            const row = document.createElement("tr");

            const values = [
                product.id,
                product.name,
                product.description,
                product.price,
                product.quantity
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            const actionCell = document.createElement("td");

            const editButton = document.createElement("button");
            editButton.textContent = "Edit";
            editButton.type = "button";

            editButton.addEventListener("click", () => {
                editProduct(product);
            });

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.type = "button";

            deleteButton.addEventListener("click", () => {
                deleteProduct(product.id);
            });

            actionCell.appendChild(editButton);
            actionCell.appendChild(deleteButton);

            row.appendChild(actionCell);

            productTableBody.appendChild(row);
        });

    } catch (error) {
        productMessage.textContent = error.message;
        productMessage.style.color = "red";
    }
}


productForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const id = Number(document.getElementById("product-id").value);

    const productData = {
        id: id,
        name: document.getElementById("product-name").value.trim(),
        description: document.getElementById("product-description").value.trim(),
        price: Number(document.getElementById("product-price").value),
        quantity: Number(document.getElementById("product-quantity").value)
    };

    try {

        if (isEditing) {

            await apiRequest(`/product/${id}`, "PUT", productData);

            productMessage.textContent = "Product updated successfully!";

        } else {

            await apiRequest("/product", "POST", productData);

            productMessage.textContent = "Product added successfully!";
        }

        productMessage.style.color = "green";

        resetForm();

        loadProducts();

    } catch (error) {

        productMessage.textContent = error.message;
        productMessage.style.color = "red";
    }
});


function editProduct(product) {

    isEditing = true;

    document.getElementById("product-id").value = product.id;
    document.getElementById("product-name").value = product.name;
    document.getElementById("product-description").value = product.description;
    document.getElementById("product-price").value = product.price;
    document.getElementById("product-quantity").value = product.quantity;

    document.getElementById("product-id").readOnly = true;

    formHeading.textContent = "Update Product";
    saveBtn.textContent = "Update Product";
    cancelBtn.hidden = false;

    productMessage.textContent = "";
}


async function deleteProduct(id) {

    const confirmDelete = confirm("Are you sure you want to delete this product?");

    if (!confirmDelete) {
        return;
    }

    try {

        const data = await apiRequest(`/product/${id}`, "DELETE");

        productMessage.textContent = data.message;
        productMessage.style.color = "green";

        resetForm();

        loadProducts();

    } catch (error) {

        productMessage.textContent = error.message;
        productMessage.style.color = "red";
    }
}


function resetForm() {

    productForm.reset();

    isEditing = false;

    document.getElementById("product-id").readOnly = false;

    formHeading.textContent = "Add New Product";
    saveBtn.textContent = "Add Product";
    cancelBtn.hidden = true;
}


cancelBtn.addEventListener("click", resetForm);

document.getElementById("refresh-btn").addEventListener("click", loadProducts);


document.getElementById("logout-btn").addEventListener("click", async function () {

    try {

        const data = await apiRequest("/logout", "POST");

        productMessage.textContent = data.message;
        productMessage.style.color = "green";

    } catch (error) {

        productMessage.textContent = error.message;
        productMessage.style.color = "red";

    } finally {

        sessionStorage.removeItem("access_token");

        window.location.href = "index.html";
    }
});


loadUserDetails();
loadProducts();
