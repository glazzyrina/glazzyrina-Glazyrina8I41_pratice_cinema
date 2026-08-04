from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from database import get_db, engine
import models
import schemas
import security

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cinema API",
    description="Бэкенд-система для кинотеатра",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Сервер кинотеатра успешно запущен и работает!"}


# AUTH & USERS

@app.post("/api/auth/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED, tags=["Auth & Users"])
def register_user(user_data: schemas.UserRegister, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user_data.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Пользователь с таким логином уже существует")
    
    hashed_pwd = security.get_password_hash(user_data.password)
    new_user = models.User(username=user_data.username, password_hash=hashed_pwd, role="Посетитель")
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", tags=["Auth & Users"])
def login_user(login_data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == login_data.username).first()
    
    if not user or not security.verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
        
    return {"access_token": f"mock-jwt-token-for-{user.username}", "token_type": "bearer", "role": user.role, "user_id": user.id}

@app.post("/api/admin/employees", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED, tags=["Auth & Users"])
def create_employee(emp_data: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == emp_data.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Логин уже занят")
        
    hashed_pwd = security.get_password_hash(emp_data.password)
    new_emp = models.User(username=emp_data.username, password_hash=hashed_pwd, role=emp_data.role)
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)
    return new_emp

@app.get("/api/users/me", response_model=schemas.UserResponse, tags=["Auth & Users"])
def get_me(username: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user


# БPOSTER & SCHEDULE

@app.get("/api/films", response_model=List[schemas.FilmResponse], tags=["Poster & Schedule"])
def get_all_films(db: Session = Depends(get_db)):
    return db.query(models.Film).all()

@app.get("/api/seances", response_model=List[schemas.SeanceResponse], tags=["Poster & Schedule"])
def get_all_seances(db: Session = Depends(get_db)):
    return db.query(models.Seance).all()


# HALLS & SEATS

@app.get("/api/halls", response_model=List[schemas.HallResponse], tags=["Halls & Seats"])
def get_halls(db: Session = Depends(get_db)):
    return db.query(models.Hall).all()

@app.get("/api/seances/{seance_id}/seats", response_model=List[schemas.SeatStatusResponse], tags=["Halls & Seats"])
def get_seance_seats_map(seance_id: int, db: Session = Depends(get_db)):
    seance = db.query(models.Seance).filter(models.Seance.id == seance_id).first()
    if not seance:
        raise HTTPException(status_code=404, detail="Сеанс не найден")
    
    all_seats = db.query(models.Seat).filter(models.Seat.hall_id == seance.hall_id).all()
    booked_tickets = db.query(models.Ticket).filter(models.Ticket.seance_id == seance_id).all()
    ticket_map = {t.seat_id: t.status for t in booked_tickets}
    
    seats_map = []
    for seat in all_seats:
        status_value = ticket_map.get(seat.id, "Свободно")
        seats_map.append({
            "seat_id": seat.id,
            "row_number": seat.row_number,
            "seat_number": seat.seat_number,
            "status": status_value
        })
    return seats_map


# CASHIER DESK

@app.post("/api/tickets/book", response_model=schemas.TicketResponse, status_code=status.HTTP_201_CREATED, tags=["Cashier Desk"])
def book_ticket(ticket_data: schemas.TicketBook, db: Session = Depends(get_db)):
    existing = db.query(models.Ticket).filter_by(seance_id=ticket_data.seance_id, seat_id=ticket_data.seat_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Место уже занято или забронировано!")
    new_booking = models.Ticket(seance_id=ticket_data.seance_id, seat_id=ticket_data.seat_id, user_id=ticket_data.user_id, status="Забронировано")
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking

@app.post("/api/tickets/sell", response_model=schemas.TicketResponse, status_code=status.HTTP_201_CREATED, tags=["Cashier Desk"])
def sell_ticket(ticket_data: schemas.TicketSell, db: Session = Depends(get_db)):
    existing = db.query(models.Ticket).filter_by(seance_id=ticket_data.seance_id, seat_id=ticket_data.seat_id).first()
    if existing and existing.status == "Забронировано":
        existing.status = "Занято"
        db.commit()
        db.refresh(existing)
        return existing
    elif existing:
        raise HTTPException(status_code=400, detail="Билет на это место уже продан!")
        
    new_ticket = models.Ticket(seance_id=ticket_data.seance_id, seat_id=ticket_data.seat_id, user_id=ticket_data.user_id, status="Занято")
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    return new_ticket

@app.post("/api/tickets/{ticket_id}/cancel", tags=["Cashier Desk"])
def cancel_or_refund_ticket(ticket_id: int, db: Session = Depends(get_db)):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Билет не найден")
    db.delete(ticket)
    db.commit()
    return {"message": "Операция отменена, место успешно освобождено"}


# ADMIN PANEL

@app.post("/api/admin/films", response_model=schemas.FilmResponse, status_code=status.HTTP_201_CREATED, tags=["Admin Panel"])
def admin_create_film(film_data: schemas.FilmCreate, db: Session = Depends(get_db)):
    new_film = models.Film(title=film_data.title, description=film_data.description, duration_min=film_data.duration_min, age_rating=film_data.age_rating)
    db.add(new_film)
    db.commit()
    db.refresh(new_film)
    return new_film

@app.post("/api/admin/seances", response_model=schemas.SeanceResponse, status_code=status.HTTP_201_CREATED, tags=["Admin Panel"])
def admin_create_seance(seance_data: schemas.SeanceCreate, db: Session = Depends(get_db)):
    if not db.query(models.Film).filter_by(id=seance_data.film_id).first() or not db.query(models.Hall).filter_by(id=seance_data.hall_id).first():
        raise HTTPException(status_code=400, detail="Указанный фильм или зал не существуют")
    new_seance = models.Seance(film_id=seance_data.film_id, hall_id=seance_data.hall_id, start_date_time=seance_data.start_date_time, base_price=seance_data.base_price)
    db.add(new_seance)
    db.commit()
    db.refresh(new_seance)
    return new_seance

@app.put("/api/admin/seances/{seance_id}", response_model=schemas.SeanceResponse, tags=["Admin Panel"])
def admin_update_seance(seance_id: int, seance_data: schemas.SeanceCreate, db: Session = Depends(get_db)):
    seance = db.query(models.Seance).filter(models.Seance.id == seance_id).first()
    if not seance:
        raise HTTPException(status_code=404, detail="Сеанс не найден")
    seance.film_id = seance_data.film_id
    seance.hall_id = seance_data.hall_id
    seance.start_date_time = seance_data.start_date_time
    seance.base_price = seance_data.base_price
    db.commit()
    db.refresh(seance)
    return seance

@app.delete("/api/admin/seances/{seance_id}", tags=["Admin Panel"])
def admin_delete_seance(seance_id: int, db: Session = Depends(get_db)):
    seance = db.query(models.Seance).filter(models.Seance.id == seance_id).first()
    if not seance:
        raise HTTPException(status_code=404, detail="Сеанс не найден")
    db.delete(seance)
    db.commit()
    return {"message": "Сеанс успешно удален из расписания"}
