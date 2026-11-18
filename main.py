
from fastapi import FastAPI
from models import product

app = FastAPI()

@app.get("/")
def greet():
    return "hi wellcome to my first fastapi"


products = [
    product(id=1, name="phone", description="budget friendly", price=45000, quantity=12),
    product(id=2, name="laptop", description="Mac Book", price=84000, quantity=5),
    product(id=3, name="watch", description="Titanic", price=10000, quantity=10)
]

@app.get("/product")
def get_all_products():
    return products


@app.get("/product/{id}")
def get_product_by_id(id: int):
    for product in products:
        if product.id == id:
            return product
    return "Product not found"


@app.post("/product")
def add_product(product: product):
    products.append(product)
    return "product added successfully"


@app.put("/product/{id}")
def update_product(id: int, product: product):
    for i in range(len(products)):
        if products[i].id == id:
            products[i] = product
            return "product updated successfully"
    return "Product Not Found!!"


@app.delete("/product/{id}")
def delete_product(id: int):
    for i in range(len(products)):
        if products[i].id == id:
            del products[i]
            return "Product deleted"
    return "Product Not Found!!"
