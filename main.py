from fastapi import FastAPI, Depends
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
        "http://localhost:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(profile_router)


@app.get("/")
def greet():
    return {
        "message": "Welcome to Product Management System"
    }


@app.get("/product")
def get_all_products(
    current_user: dict = Depends(get_current_user)
):
    return list(products_collection.find({}, {"_id": 0}))


@app.get("/product/{id}")
def get_product_by_id(
    id: int,
    current_user: dict = Depends(get_current_user)
):
    product_data = products_collection.find_one(
        {"id": id},
        {"_id": 0}
    )

    if product_data:
        return product_data

    return {"message": "Product not found"}


@app.post("/product")
def add_product(
    product_data: product,
    current_user: dict = Depends(get_current_user)
):
    products_collection.insert_one(product_data.model_dump())

    return {
        "message": "Product added successfully"
    }


@app.put("/product/{id}")
def update_product(
    id: int,
    product_data: product,
    current_user: dict = Depends(get_current_user)
):
    result = products_collection.update_one(
        {"id": id},
        {"$set": product_data.model_dump()}
    )

    if result.matched_count:
        return {
            "message": "Product updated successfully"
        }

    return {"message": "Product not found"}


@app.delete("/product/{id}")
def delete_product(
    id: int,
    current_user: dict = Depends(get_current_user)
):
    result = products_collection.delete_one({"id": id})

    if result.deleted_count:
        return {
            "message": "Product deleted successfully"
        }

    return {"message": "Product not found"}