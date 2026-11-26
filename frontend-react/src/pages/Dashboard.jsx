import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

const initialProduct = {
  id: "",
  name: "",
  description: "",
  price: "",
  quantity: "",
};

function getStockClass(status) {
  switch (status) {
    case "In Stock":
      return "in-stock";

    case "Low Stock":
      return "low-stock";

    case "Out of Stock":
      return "out-of-stock";

    default:
      return "unknown-stock";
  }
}

function Dashboard() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("access_token");

  const [user, setUser] = useState({});
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState(initialProduct);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const [profilePicture, setProfilePicture] = useState(null);
  const [pictureUrl, setPictureUrl] = useState("");

  const [search, setSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(true);
  const [searchError, setSearchError] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const requestRef = useRef(null);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("session_id");
    sessionStorage.removeItem("expires_at");

    navigate("/", { replace: true });
  }, [navigate]);

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
  };

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        clearSession();
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to retrieve user details");
      }

      const data = await response.json();

      setUser(data);
    } catch (error) {
      console.error(error);
      setMessage("Unable to load user details.");
      setMessageType("error");
    }
  }, [token, clearSession]);

  const fetchProfilePicture = useCallback(
    async (signal) => {
      try {
        const response = await fetch(
          `${API_URL}/profile/picture`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal,
          }
        );

        if (signal.aborted) {
          return;
        }

        if (response.status === 401) {
          clearSession();
          return;
        }

        if (response.status === 404) {
          setProfilePicture(null);
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to retrieve profile picture");
        }

        const imageBlob = await response.blob();

        if (!signal.aborted) {
          setProfilePicture(imageBlob);
        }
      } catch (error) {
        if (
          error.name !== "AbortError" &&
          !signal.aborted
        ) {
          console.error(error);
          setProfilePicture(null);
        }
      }
    },
    [token, clearSession]
  );

  useEffect(() => {
    if (!token) {
      clearSession();
      return;
    }

    const controller = new AbortController();

    fetchProfilePicture(controller.signal);

    return () => controller.abort();
  }, [token, clearSession, fetchProfilePicture]);

  useEffect(() => {
    if (!profilePicture) {
      setPictureUrl("");
      return;
    }

    const imageUrl = URL.createObjectURL(profilePicture);

    setPictureUrl(imageUrl);

    return () => URL.revokeObjectURL(imageUrl);
  }, [profilePicture]);

  const fetchProducts = useCallback(
    async (keyword, currentPage, pageLimit) => {
      requestRef.current?.abort();

      const controller = new AbortController();
      requestRef.current = controller;

      setSearchLoading(true);
      setSearchError("");

      try {
        const params = new URLSearchParams({
          search: keyword.trim(),
          page: String(currentPage),
          limit: String(pageLimit),
        });

        const response = await fetch(
          `${API_URL}/product?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (controller.signal.aborted) {
          return;
        }

        if (response.status === 401) {
          clearSession();
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to retrieve products");
        }

        const data = await response.json();

        if (controller.signal.aborted) {
          return;
        }

        if (!Array.isArray(data.products)) {
          throw new Error("Invalid product response");
        }

        const lastPage = Math.max(1, data.total_pages);

        if (currentPage > lastPage) {
          requestRef.current = null;
          setPage(lastPage);
          return;
        }

        setProducts(data.products);
        setTotalProducts(data.total_products);
        setTotalPages(data.total_pages);
        setHasNext(data.has_next);
        setHasPrevious(data.has_previous);
      } catch (error) {
        if (
          error.name !== "AbortError" &&
          !controller.signal.aborted
        ) {
          console.error(error);
          setSearchError("Unable to load products.");
        }
      } finally {
        if (requestRef.current === controller) {
          setSearchLoading(false);
        }
      }
    },
    [token, clearSession]
  );

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    setSearchLoading(true);
    setSearchError("");

    const timer = setTimeout(() => {
      fetchProducts(search, page, limit);
    }, 300);

    return () => {
      clearTimeout(timer);
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, [search, page, limit, refreshKey, fetchProducts]);

  const cancelCurrentRequest = () => {
    requestRef.current?.abort();
    requestRef.current = null;

    setSearchLoading(true);
    setSearchError("");
  };

  const refreshProducts = () => {
    cancelCurrentRequest();
    setRefreshKey((previous) => previous + 1);
  };

  const handleSearch = (value) => {
    if (value === search) {
      return;
    }

    cancelCurrentRequest();

    setSearch(value);
    setPage(1);
  };

  const handleLimitChange = (event) => {
    const newLimit = Number(event.target.value);

    if (newLimit === limit) {
      return;
    }

    cancelCurrentRequest();

    setLimit(newLimit);
    setPage(1);
  };

  const handlePreviousPage = () => {
    if (hasPrevious && !searchLoading) {
      cancelCurrentRequest();

      setPage((previousPage) =>
        Math.max(1, previousPage - 1)
      );
    }
  };

  const handleNextPage = () => {
    if (hasNext && !searchLoading) {
      cancelCurrentRequest();

      setPage((previousPage) => previousPage + 1);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProduct((previousProduct) => ({
      ...previousProduct,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setProduct(initialProduct);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const productData = {
      id: Number(product.id),
      name: product.name.trim(),
      description: product.description.trim(),
      price: Number(product.price),
      quantity: Number(product.quantity),
    };

    const isEditing = editingId !== null;

    const url = isEditing
      ? `${API_URL}/product/${editingId}`
      : `${API_URL}/product`;

    try {
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      if (response.status === 401) {
        clearSession();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        showMessage(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to save product.",
          "error"
        );

        return;
      }

      showMessage(
        isEditing
          ? "Product updated successfully!"
          : "Product added successfully!",
        "success"
      );

      resetForm();

      refreshProducts();
    } catch (error) {
      console.error(error);
      showMessage("Unable to connect to the backend.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (selectedProduct) => {
    setEditingId(selectedProduct.id);

    setProduct({
      id: selectedProduct.id,
      name: selectedProduct.name,
      description: selectedProduct.description,
      price: selectedProduct.price,
      quantity: selectedProduct.quantity,
    });

    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/product/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        clearSession();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        showMessage(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to delete product.",
          "error"
        );

        return;
      }

      if (editingId === id) {
        resetForm();
      }

      showMessage("Product deleted successfully!", "success");

      refreshProducts();
    } catch (error) {
      console.error(error);
      showMessage("Unable to delete product.", "error");
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_URL}/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok && response.status !== 401) {
        showMessage("Logout failed. Please try again.", "error");
        return;
      }

      clearSession();
    } catch (error) {
      console.error(error);
      showMessage("Unable to logout. Please try again.", "error");
    }
  };

  const firstProduct =
    totalProducts === 0 ? 0 : (page - 1) * limit + 1;

  const lastProduct = Math.min(
    page * limit,
    totalProducts
  );

  return (
    <div className="dashboard-container">

      <header className="dashboard-header">

        <div className="dashboard-header-content">

          <h1>Product Management System</h1>

          <div className="dashboard-user-info">

            <div className="dashboard-avatar">

              {pictureUrl ? (
                <img
                  src={pictureUrl}
                  alt="Profile"
                  className="dashboard-profile-picture"
                  onError={() => setProfilePicture(null)}
                />
              ) : (
                <div className="dashboard-avatar-placeholder">
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
                  </svg>
                </div>
              )}

            </div>

            <div className="dashboard-user-details">
              <h3>Welcome, {user.name || "User"}!</h3>
              <p>{user.email}</p>
            </div>

          </div>

        </div>

        <div className="header-actions">
          <button
            type="button"
            onClick={() => navigate("/profile")}
          >
            My Profile
          </button>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

      </header>

      <section className="dashboard-card">
        <h2>
          {editingId !== null ? "Update Product" : "Add Product"}
        </h2>

        <form
          className="product-form"
          onSubmit={handleSubmit}
        >
          <input
            type="number"
            name="id"
            placeholder="Product ID"
            value={product.id}
            onChange={handleChange}
            min="1"
            step="1"
            required
          />

          <input
            type="text"
            name="name"
            placeholder="Product Name"
            value={product.name}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="description"
            placeholder="Description"
            value={product.description}
            onChange={handleChange}
            required
          />

          <input
            type="number"
            name="price"
            placeholder="Price"
            value={product.price}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
          />

          <input
            type="number"
            name="quantity"
            placeholder="Quantity"
            value={product.quantity}
            onChange={handleChange}
            min="0"
            step="1"
            required
          />

          <button type="submit" disabled={loading}>
            {loading
              ? "Saving..."
              : editingId !== null
              ? "Update Product"
              : "Add Product"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              className="cancel-button"
              onClick={() => {
                resetForm();
                setMessage("");
              }}
            >
              Cancel
            </button>
          )}
        </form>

        {message && (
          <p className={`${messageType}-message`}>
            {message}
          </p>
        )}
      </section>

      <section className="dashboard-card">
        <h2>All Products</h2>

        <div className="search-container">
          <input
            type="search"
            className="search-input"
            placeholder="Search by product ID, name or description..."
            aria-label="Search products"
            value={search}
            maxLength={100}
            onChange={(event) =>
              handleSearch(event.target.value)
            }
          />

          <button
            type="button"
            className="clear-search-button"
            onClick={() => handleSearch("")}
            disabled={!search}
          >
            Clear Search
          </button>
        </div>

        <div className="product-toolbar">
          <p className="product-count">
            {searchLoading
              ? "Loading products..."
              : searchError
              ? "Product count unavailable"
              : search.trim()
              ? `Matching Products: ${totalProducts}`
              : `Total Products: ${totalProducts}`}
          </p>

          <div className="page-size-container">
            <label htmlFor="page-size">
              Products per page:
            </label>

            <select
              id="page-size"
              className="page-size-select"
              value={limit}
              onChange={handleLimitChange}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        {searchError && (
          <p className="error-message">{searchError}</p>
        )}

        <div className="table-container">
          <table className="product-table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Stock Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {searchLoading ? (
                <tr>
                  <td colSpan="7">Loading products...</td>
                </tr>
              ) : searchError ? (
                <tr>
                  <td colSpan="7">
                    Unable to display products.
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    {search.trim()
                      ? "No matching products found."
                      : "No products found."}
                  </td>
                </tr>
              ) : (
                products.map((item) => (
                  <tr key={item.id}>

                    <td>{item.id}</td>

                    <td>{item.name}</td>

                    <td>{item.description}</td>

                    <td>
                      ₹{Number(item.price).toFixed(2)}
                    </td>

                    <td>{item.quantity}</td>

                    <td>
                      <span
                        className={`stock-badge ${getStockClass(
                          item.stock_status
                        )}`}
                      >
                        {item.stock_status || "Unknown"}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="edit-button"
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-button"
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>

        {!searchLoading && !searchError && (
          <div className="pagination-container">

            <p className="pagination-info">
              Showing {firstProduct} - {lastProduct} of{" "}
              {totalProducts} products
            </p>

            <div className="pagination-controls">

              <button
                type="button"
                className="pagination-button"
                onClick={handlePreviousPage}
                disabled={!hasPrevious || totalPages === 0}
              >
                Previous
              </button>

              <span className="page-indicator">
                Page {totalPages === 0 ? 0 : page} of{" "}
                {totalPages}
              </span>

              <button
                type="button"
                className="pagination-button"
                onClick={handleNextPage}
                disabled={!hasNext}
              >
                Next
              </button>

            </div>
          </div>
        )}

      </section>
    </div>
  );
}

export default Dashboard;