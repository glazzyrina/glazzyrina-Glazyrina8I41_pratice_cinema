from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from database import get_db, engine
import models
import schemas
import security
from datetime import datetime


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

@app.post("/api/tickets/book", tags=["Tickets"])
def book_ticket(ticket_data: schemas.TicketBook, db: Session = Depends(get_db)):
    # 1. Проверяем, не занято ли уже это место на этот сеанс
    existing = db.query(models.Ticket).filter(
        models.Ticket.seance_id == ticket_data.seance_id,
        models.Ticket.seat_id == ticket_data.seat_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Это место уже занято или забронировано")
    
    # 2. Если фронтенд прислал пустой user_id, берем ID самого первого пользователя из базы
    target_user_id = ticket_data.user_id
    if target_user_id is None:
        first_user = db.query(models.User).first()
        target_user_id = first_user.id if first_user else 1

    # 3. Создаем бронь в базе данных
    new_ticket = models.Ticket(
        seance_id=ticket_data.seance_id,
        seat_id=ticket_data.seat_id,
        user_id=target_user_id,
        status="Забронировано"
    )
    db.add(new_ticket)
    db.commit()
    return {"message": "Успешно забронировано"}


@app.post("/api/tickets/sell", tags=["Tickets"])
def sell_ticket(ticket_data: schemas.TicketBook, db: Session = Depends(get_db)):
    # 1. Проверяем статус места
    existing = db.query(models.Ticket).filter(
        models.Ticket.seance_id == ticket_data.seance_id,
        models.Ticket.seat_id == ticket_data.seat_id
    ).first()
    
    # 2. Если кассир выкупает чью-то бронь — просто меняем статус на "Занято"
    if existing and existing.status == "Забронировано":
        existing.status = "Занято"
        db.commit()
        return {"message": "Бронь успешно выкуплена кассиром"}
    elif existing:
        raise HTTPException(status_code=400, detail="Билет на это место уже продан!")
        
    # 3. Если это прямая покупка на кассе без брони
    target_user_id = ticket_data.user_id
    if target_user_id is None:
        first_user = db.query(models.User).first()
        target_user_id = first_user.id if first_user else 1

    new_ticket = models.Ticket(
        seance_id=ticket_data.seance_id,
        seat_id=ticket_data.seat_id,
        user_id=target_user_id,
        status="Занято"
    )
    db.add(new_ticket)
    db.commit()
    return {"message": "Билет успешно продан кассиром"}


@app.post("/api/tickets/cancel", tags=["Cashier Desk"])
def cashier_cancel_ticket(ticket_data: dict, db: Session = Depends(get_db)):
    # Проверяем оба возможных названия ключа, которые мог прислать фронтенд
    seance_id = ticket_data.get("seance_id")
    seat_id = ticket_data.get("seat_id") or ticket_data.get("id")
    
    # Если фронтенд прислал пустоту, не даем Python упасть в ошибку 500
    if seance_id is None or seat_id is None:
        raise HTTPException(status_code=400, detail="Отсутствуют обязательные поля seance_id или seat_id")
    
    # Ищем билет в базе по сеансу и месту
    ticket = db.query(models.Ticket).filter(
        models.Ticket.seance_id == int(seance_id),
        models.Ticket.seat_id == int(seat_id)
    ).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Билет или бронь на это место не найдены в базе данных")
    
    db.delete(ticket)
    db.commit()
    return {"message": "Билет успешно аннулирован кассиром"}

# ADMIN PANEL

@app.post("/api/admin/films", response_model=schemas.FilmResponse, status_code=status.HTTP_201_CREATED, tags=["Admin Panel"])
def admin_create_film(film_data: schemas.FilmCreate, db: Session = Depends(get_db)):
    new_film = models.Film(
        title=film_data.title, 
        description=film_data.description, 
        duration_min=film_data.duration_min, 
        age_rating=film_data.age_rating,
        poster_url=film_data.poster_url # Добавили сохранение ссылки
    )
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

@app.put("/api/admin/films/{film_id}", response_model=schemas.FilmResponse, tags=["Admin Panel"])
def admin_update_film(film_id: int, film_data: schemas.FilmCreate, db: Session = Depends(get_db)):
    film = db.query(models.Film).filter(models.Film.id == film_id).first()
    if not film:
        raise HTTPException(status_code=404, detail="Фильм не найден")
    film.title = film_data.title
    film.description = film_data.description
    film.duration_min = film_data.duration_min
    film.age_rating = film_data.age_rating
    film.poster_url = film_data.poster_url
    db.commit()
    db.refresh(film)
    return film

@app.delete("/api/admin/films/{film_id}", tags=["Admin Panel"])
def admin_delete_film(film_id: int, db: Session = Depends(get_db)):
    film = db.query(models.Film).filter(models.Film.id == film_id).first()
    if not film:
        raise HTTPException(status_code=404, detail="Фильм не найден")
    db.delete(film)
    db.commit()
    return {"message": "Фильм успешно удален из афиши"}

@app.get("/api/tickets/my", tags=["Tickets"])
def get_my_tickets(username: str, db: Session = Depends(get_db)):
    # 1. Находим пользователя по его имени
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # 2. Достаем все билеты этого пользователя
    tickets = db.query(models.Ticket).filter(models.Ticket.user_id == user.id).all()
    
    # 3. Вручную собираем простой и понятный JSON для фронтенда, чтобы избежать ошибки 500
    result = []
    for ticket in tickets:
        # Ищем сеанс для этого билета
        seance = db.query(models.Seance).filter(models.Seance.id == ticket.seance_id).first()
        
        # Безопасно вытаскиваем данные фильма и зала, если они есть
        film_title = seance.film.title if (seance and seance.film) else "Фильм"
        hall_name = seance.hall.name if (seance and seance.hall) else "Зал"
        start_time = seance.start_date_time if seance else datetime.now()
        base_price = seance.base_price if seance else 0
        
        # Ищем ряд и место кресла
        seat = db.query(models.Seat).filter(models.Seat.id == ticket.seat_id).first()
        row_num = seat.row_number if seat else 1
        seat_num = seat.seat_number if seat else 1

        result.append({
            "id": ticket.id,
            "status": ticket.status,
            "seance": {
                "start_date_time": start_time,
                "base_price": base_price,
                "film": {
                    "title": film_title
                },
                "hall": {
                    "name": hall_name
                }
            },
            "seat": {
                "row_number": row_num,
                "seat_number": seat_num
            }
        })
        
    return result

@app.delete("/api/tickets/{ticket_id}", tags=["Tickets"])
def delete_user_ticket(ticket_id: int, db: Session = Depends(get_db)):
    # Ищем билет в базе данных
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Билет не найден")
    
    # Удаляем билет (место в зале снова станет свободным и зеленым!)
    db.delete(ticket)
    db.commit()
    return {"message": "Бронирование успешно отменено"}


@app.get("/api/admin/employees", tags=["Admin Panel"])
def get_all_employees(db: Session = Depends(get_db)):
    # Вытаскиваем из базы данных только Кассиров и Администраторов (посетителей скрываем)
    employees = db.query(models.User).filter(models.User.role.in_(["Кассир", "Администратор"])).all()
    return employees

@app.delete("/api/admin/employees/{user_id}", tags=["Admin Panel"])
def delete_employee(user_id: int, admin_username: str, db: Session = Depends(get_db)):
    # 1. Находим в базе данных самого увольняемого сотрудника
    employee = db.query(models.User).filter(models.User.id == user_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
        
    # 2. Железная защита на бэкенде: сравниваем логин увольняемого с логином того, кто нажал на кнопку
    if employee.username == admin_username:
        raise HTTPException(status_code=400, detail="Вы не можете удалить свою собственную учетную запись администратора!")
    
    # 3. Если всё в порядке — удаляем
    db.delete(employee)
    db.commit()
    return {"message": "Сотрудник успешно удален из системы"}

