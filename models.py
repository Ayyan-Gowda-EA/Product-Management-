
from pydantic import BaseModel, Field


class product(BaseModel):
    id: int
    name: str
    description: str
    price: float
    quantity: int


class UserRegister(BaseModel):
    name: str
    email: str
    password: str = Field(min_length=8)


class UserLogin(BaseModel):
    email: str
    password: str


class UserProfile(BaseModel):
    full_name: str
    phone_number: str
    date_of_birth: str
    gender: str
    address: str
