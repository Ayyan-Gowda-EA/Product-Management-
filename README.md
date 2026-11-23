# Product Management System

A full-stack Product Management System built using **FastAPI, MongoDB, HTML, CSS, and JavaScript**, with user authentication, JWT-based authorization, session management, and profile management.

## Features

### User Authentication
- User registration and login using email and password.
- Secure password hashing using Argon2.
- JWT access token authentication.
- Session management with configurable expiry.
- Logout with session invalidation.
- Validation for invalid and expired tokens.

### User Profile Management
- View logged-in user details.
- Update personal information.
- Manage full name, phone number, date of birth, gender, and address.
- Store and retrieve profile information using MongoDB.

### Product Management
- Create new products.
- Retrieve all products.
- Retrieve a product by ID.
- Update existing products.
- Delete products.
- Protected product APIs.

## Technologies Used

**Backend:** Python, FastAPI

**Database:** MongoDB Atlas, PyMongo

**Authentication:** JWT, Argon2, Bearer Token

**Frontend:** HTML, CSS, JavaScript

**API Testing:** Postman, Swagger UI

**Tools:** VS Code, Git, GitHub

## Project Structure

```text
Products/
├── main.py
├── database.py
├── models.py
├── security.py
├── dependencies.py
├── requirements.txt
├── routes/
│   ├── auth.py
│   └── profile.py
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── dashboard.html
│   ├── dashboard.js
│   ├── profile.html
│   └── profile.js
├── postman/
└── test_mongodb.py
```

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Ayyan-Gowda-EA/Product-Management-.git
cd Product-Management-
```

### 2. Create a Virtual Environment

```bash
python3 -m venv myenv
```

Activate it:

**macOS/Linux:**
```bash
source myenv/bin/activate
```

**Windows:**
```bash
myenv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the project root directory.

Configure the required variables according to your application:

```env
MONGO_URL=your_mongodb_connection_string
SECRET_KEY=your_secret_key
```

Use your own MongoDB connection string and a strong secret key. Never upload `.env` to GitHub.

### 5. Run the Backend

```bash
uvicorn main:app --reload
```

Backend URL:

http://127.0.0.1:8000

Swagger API Documentation:

http://127.0.0.1:8000/docs

### 6. Run the Frontend

Open the `frontend` folder in VS Code.

Run `index.html` using the Live Server extension.

Example:

http://127.0.0.1:5500/frontend/index.html

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register a new user |
| POST | `/login` | Authenticate user |
| POST | `/logout` | Logout and invalidate session |
| GET | `/profile` | Retrieve user profile |
| POST | `/profile` | Create or update profile |
| GET | `/product` | Retrieve all products |
| POST | `/product` | Create a product |
| GET | `/product/{id}` | Retrieve product by ID |
| PUT | `/product/{id}` | Update a product |
| DELETE | `/product/{id}` | Delete a product |

Protected endpoints require a valid JWT Bearer token.

## API Testing

The project includes a Postman collection containing requests for authentication, profile management, and product CRUD operations.

You can also test the APIs using Swagger UI at:

http://127.0.0.1:8000/docs

## Security

- Passwords are hashed before storing them.
- JWT tokens are used for authentication.
- Protected routes require valid authentication.
- Sessions are validated and invalidated during logout.
- Environment variables are used for sensitive configuration.
- `.env` and virtual environment folders are excluded from Git.

## Author

**Ayyan Gowda E A**

GitHub: https://github.com/Ayyan-Gowda-EA