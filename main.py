from fastapi import FastAPI
from models import product
from database import products_collection

app = FastAPI()


@app.get("/")
def greet():
    return "hi wellcome to my first fastapi"


@app.get("/product")
def get_all_products():
    return list(products_collection.find({}, {"_id": 0}))


@app.get("/product/{id}")
def get_product_by_id(id: int):
    product_data = products_collection.find_one(
        {"id": id},
        {"_id": 0}
    )

    if product_data:
        return product_data

    return "Product not found"


@app.post("/product")
def add_product(product: product):
    products_collection.insert_one(product.model_dump())
    return "product added successfully"


@app.put("/product/{id}")
def update_product(id: int, product: product):
    result = products_collection.update_one(
        {"id": id},
        {"$set": product.model_dump()}
    )

    if result.matched_count:
        return "product updated successfully"

    return "Product Not Found!!"


@app.delete("/product/{id}")
def delete_product(id: int):
    result = products_collection.delete_one({"id": id})

    if result.deleted_count:
        return "Product deleted"

    return "Product Not Found!!"