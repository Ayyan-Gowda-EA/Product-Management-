# Product Management System

A full-stack Product Management System built using React.js, FastAPI
and MongoDB Atlas. The application includes user authentication,
session management, profile management and product inventory management.

## Features

### User Authentication
- User registration and login using email and password.
- Secure password hashing using Argon2.
- JWT-based authentication and authorization.
- Unique session ID generation.
- Configurable session expiry using environment variables.
- Logout with session invalidation.
- Handling invalid and expired tokens.
- Protected frontend routes and backend APIs.

### User Profile Management
- View logged-in user details.
- Create and update personal information.
- Manage full name, phone number, date of birth, gender and address.
- Store and retrieve profile information using MongoDB.
- Redirect users to profile completion after their first login.
- Display user name and email on the dashboard.

### Profile Picture Management
- Upload, update and remove profile pictures.
- Preview selected images before uploading.
- Support JPG, JPEG and PNG image formats.
- Maximum image upload size of 2 MB.
- Image format and content validation.
- Store profile pictures in MongoDB.
- Display profile pictures on the dashboard.
- User-specific profile picture access.

### Product Management
- Create new products.
- Retrieve products.
- Retrieve a product by ID.
- Update existing products.
- Delete products.
- Duplicate product ID validation.
- Protected product management APIs.

### Product Search
- Search products by name, ID or description.
- Case-insensitive text search.
- Dynamic search results.
- Clear search functionality.

### Product Pagination
- Backend-based pagination.
- Previous and next page navigation.
- Configurable number of products per page.
- Display total products and page count.
- Pagination support for search results.

### Stock Availability Status
Automatically display stock availability based on product quantity.

| Quantity | Stock Status |
|---|---|
| More than 5 | In Stock |
| 1 to 5 | Low Stock |
| 0 or below | Out of Stock |

Stock availability is displayed using color-coded badges on the
dashboard.

## Technologies Used

**Frontend:** React.js, JavaScript, JSX, CSS

**Frontend Routing:** React Router DOM

**Frontend Development Tool:** Vite

**Backend:** Python, FastAPI

**Database:** MongoDB Atlas, PyMongo

**Authentication:** JWT, Argon2, Bearer Token

**Image Validation:** Pillow

**File Upload:** Python Multipart

**API Testing:** Postman, Swagger UI

**Development Tools:** VS Code, Git, GitHub

## System Architecture

React Frontend
       |
       | REST API Requests
       |
FastAPI Backend
       |
       | PyMongo
       |
MongoDB Atlas

The React frontend communicates with the FastAPI backend using
the Fetch API. The backend validates requests, manages authentication,
processes application logic and communicates with MongoDB.

## Project Structure

```text
Products/
├── main.py
├── database.py
├── models.py
├── security.py
├── dependencies.py
├── requirements.txt
├── README.md
├── .gitignore
├── routes/
│   ├── auth.py
│   └── profile.py
├── frontend-react/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
├── frontend/
├── postman/
└── test_mongodb.py
```

The frontend-react folder contains the current React application.
The frontend folder contains the original HTML, CSS and JavaScript
implementation retained for reference.

## Database Collections

| Collection | Purpose |
|---|---|
| users | User registration and authentication details |
| sessions | User sessions and session expiry |
| profiles | Personal information and profile pictures |
| products | Product inventory information |

## Installation and Setup

### 1. Clone the Repository

```bash
git clone -b react-upgrade https://github.com/Ayyan-Gowda-EA/Product-Management-.git
cd Product-Management-
```

### 2. Create a Virtual Environment

```bash
python3 -m venv myenv
```

Activate the virtual environment.

**macOS/Linux:**

```bash
source myenv/bin/activate
```

**Windows:**

```bash
myenv\Scripts\activate
```

### 3. Install Backend Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory.

```env
MONGODB_URL=your_mongodb_connection_string
SECRET_KEY=your_secret_key
ALGORITHM=HS256
SESSION_EXPIRE_DAYS=7
```

Use your own MongoDB connection string and a strong secret key.

The session expiry duration can be configured according to the
application requirements, such as 7, 15 or 30 days.

Never upload the `.env` file to GitHub.

### 5. Run the Backend

Open Terminal 1 and run:

```bash
uvicorn main:app --reload
```

Backend URL:

http://127.0.0.1:8000

Swagger API Documentation:

http://127.0.0.1:8000/docs

### 6. Install Frontend Dependencies

Make sure Node.js and npm are installed.

Open Terminal 2 and run:

```bash
cd frontend-react
npm install
```

### 7. Run the React Frontend

```bash
npm run dev
```

Frontend URL:

http://localhost:5173

Keep both the backend and frontend servers running.

## API Endpoints

### Authentication APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Welcome API |
| POST | `/register` | Register a new user |
| POST | `/login` | Authenticate user and generate token |
| GET | `/me` | Retrieve logged-in user details |
| POST | `/logout` | Logout and invalidate session |

### Profile APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/profile` | Retrieve user profile |
| POST | `/profile` | Create or update user profile |
| POST | `/profile/picture` | Upload or update profile picture |
| GET | `/profile/picture` | Retrieve profile picture |
| DELETE | `/profile/picture` | Remove profile picture |

### Product APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/product` | Retrieve products with search and pagination |
| GET | `/product/{id}` | Retrieve product by ID |
| POST | `/product` | Create a product |
| PUT | `/product/{id}` | Update a product |
| DELETE | `/product/{id}` | Delete a product |

Protected endpoints require a valid JWT Bearer token.

### Product Search Example

```text
GET /product?search=laptop
```

### Product Pagination Example

```text
GET /product?page=1&limit=5
```

### Combined Search and Pagination

```text
GET /product?search=laptop&page=1&limit=5
```

## Application Workflow

1. The user registers using their name, email and password.
2. The user logs in using valid credentials.
3. The backend generates a JWT access token and session ID.
4. First-time users are redirected to the profile completion page.
5. After completing the profile, the user accesses the dashboard.
6. The user can upload or update their profile picture.
7. The user can add, view, update, delete and search products.
8. Products are displayed with pagination and stock availability.
9. The user can update their profile information.
10. Logout invalidates the current session.

## API Testing

The application APIs have been tested using Postman and Swagger UI.

Testing includes:

- User registration and login.
- JWT token validation.
- Invalid and expired token handling.
- Session invalidation after logout.
- Profile creation and update.
- Product CRUD operations.
- Duplicate product ID validation.
- Product search and pagination.
- Stock availability status.
- Profile picture upload, update and removal.
- Invalid image format validation.
- Image size validation.
- Unauthorized API access.
- Profile picture isolation between different users.

The repository includes a Postman collection for API testing.

Configure the required Postman variables locally before sending
requests. Do not store actual credentials or access tokens in GitHub.

## Security

- Passwords are hashed using Argon2 before storage.
- JWT tokens are used for authentication.
- Protected APIs require valid authentication.
- Sessions are validated before granting access.
- Sessions are invalidated during logout.
- Invalid and expired tokens are rejected.
- Profile pictures are accessible only through the authenticated
  user's profile APIs.
- Uploaded images are validated for format and size.
- Sensitive configuration is managed using environment variables.
- Environment files and dependency folders are excluded from Git.

## Author

**Ayyan Gowda E A**

GitHub: https://github.com/Ayyan-Gowda-EA