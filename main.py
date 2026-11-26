import re

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from models import product
from database import products_collection
from routes.auth import router as auth_router
from routes.profile import router as profile_router
from dependencies import get_current_user


app = FastAPI(title="Product Management System")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:5173",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(profile_router)


def get_stock_status(quantity: int):
    if quantity <= 0:
        return "Out of Stock"

    elif quantity <= 5:
        return "Low Stock"

    else:
        return "In Stock"


@app.get("/")
def greet():
    return {
        "message": "Welcome to Product Management System"
    }


@app.get("/product")
def get_all_products(
    search: str = Query(default="", max_length=100),
    page: int = Query(default=1, ge=1, le=1000000),
    limit: int = Query(default=5, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    search = search.strip()

    query = {}

    if search:
        search_pattern = re.escape(search)

        search_conditions = [
            {
                "name": {
                    "$regex": search_pattern,
                    "$options": "i"
                }
            },
            {
                "description": {
                    "$regex": search_pattern,
                    "$options": "i"
                }
            }
        ]

        if search.isascii() and search.isdecimal():
            product_id = int(search)

            if product_id <= 9223372036854775807:
                search_conditions.append(
                    {"id": product_id}
                )

        query = {
            "$or": search_conditions
        }

    total_products = products_collection.count_documents(query)

    total_pages = (total_products + limit - 1) // limit

    skip = (page - 1) * limit

    products = list(
        products_collection.find(query, {"_id": 0})
        .sort([("id", 1), ("_id", 1)])
        .skip(skip)
        .limit(limit)
    )

    for item in products:
        item["stock_status"] = get_stock_status(
            item["quantity"]
        )

    return {
        "products": products,
        "total_products": total_products,
        "total_pages": total_pages,
        "current_page": page,
        "limit": limit,
        "has_next": page < total_pages,
        "has_previous": page > 1
    }


@app.get("/product/{id}")
def get_product_by_id(
    id: int,
    current_user: dict = Depends(get_current_user)
):
    product_data = products_collection.find_one(
        {"id": id},
        {"_id": 0}
    )

    if not product_data:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    product_data["stock_status"] = get_stock_status(
        product_data["quantity"]
    )

    return product_data


@app.post("/product")
def add_product(
    product_data: product,
    current_user: dict = Depends(get_current_user)
):
    existing_product = products_collection.find_one(
        {"id": product_data.id}
    )

    if existing_product:
        raise HTTPException(
            status_code=409,
            detail="Product ID already exists. Please enter a different ID."
        )

    products_collection.insert_one(
        product_data.model_dump()
    )

    return {
        "message": "Product added successfully"
    }


@app.put("/product/{id}")
def update_product(
    id: int,
    product_data: product,
    current_user: dict = Depends(get_current_user)
):
    existing_product = products_collection.find_one(
        {"id": id}
    )

    if not existing_product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    duplicate_product = products_collection.find_one(
        {
            "id": product_data.id,
            "_id": {"$ne": existing_product["_id"]}
        }
    )

    if duplicate_product:
        raise HTTPException(
            status_code=409,
            detail="Product ID already exists. Please enter a different ID."
        )

    result = products_collection.update_one(
        {"_id": existing_product["_id"]},
        {"$set": product_data.model_dump()}
    )

    if not result.matched_count:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return {
        "message": "Product updated successfully"
    }


@app.delete("/product/{id}")
def delete_product(
    id: int,
    current_user: dict = Depends(get_current_user)
):
    result = products_collection.delete_one(
        {"id": id}
    )

    if not result.deleted_count:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return {
        "message": "Product deleted successfully"
    }