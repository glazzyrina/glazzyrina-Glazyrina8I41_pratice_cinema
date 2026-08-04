from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from typing import Optional, List

# Схемы для пользователей
class UserRegister(BaseModel):
    username: str
    password: str

class EmployeeCreate(BaseModel):
    username: str
    password: str
    role: str

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: str

# Схемы для фильмов
class FilmCreate(BaseModel):
    title: str
    description: Optional[str] = None
    duration_min: int
    age_rating: str
    poster_url: Optional[str] = None

class FilmResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    duration_min: int
    age_rating: str
    poster_url: Optional[str] = None
    class Config:
        from_attributes = True

# Схемы для залов и мест
class HallResponse(BaseModel):
    id: int
    name: str
    total_seats: int
    class Config:
        from_attributes = True

class SeatStatusResponse(BaseModel):
    seat_id: int
    row_number: int
    seat_number: int
    status: str  # 'Свободно', 'Занято' или 'Забронировано'

# Схемы для сеансов
class SeanceCreate(BaseModel):
    film_id: int
    hall_id: int
    start_date_time: datetime
    base_price: Decimal

class SeanceResponse(BaseModel):
    id: int
    film_id: int
    hall_id: int
    start_date_time: datetime
    base_price: Decimal
    film: FilmResponse
    hall: HallResponse
    class Config:
        from_attributes = True

# Схемы для билетов
class TicketSell(BaseModel):
    seance_id: int
    seat_id: int
    user_id: Optional[int] = None

class TicketBook(BaseModel):
    seance_id: int
    seat_id: int
    user_id: Optional[int] = None

class TicketResponse(BaseModel):
    id: int
    seance_id: int
    seat_id: int
    user_id: Optional[int]
    sale_date_time: datetime
    status: str
    class Config:
        from_attributes = True
