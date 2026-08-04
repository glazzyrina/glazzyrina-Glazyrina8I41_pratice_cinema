from sqlalchemy import Column, Integer, String, Text, DateTime, Numeric, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

# Таблица пользователей и персонала
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    
    tickets = relationship("Ticket", back_populates="user")

# Таблица кинофильмов
class Film(Base):
    __tablename__ = "film"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    duration_min = Column(Integer, nullable=False)
    age_rating = Column(String(10), nullable=False)
    poster_url = Column(Text, nullable=True)
    
    seances = relationship("Seance", back_populates="film")

# Таблица зрительных залов
class Hall(Base):
    __tablename__ = "hall"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)
    total_seats = Column(Integer, nullable=False)
    
    seats = relationship("Seat", back_populates="hall")
    seances = relationship("Seance", back_populates="hall")

# Таблица физических мест в залах
class Seat(Base):
    __tablename__ = "seat"
    id = Column(Integer, primary_key=True, index=True)
    hall_id = Column(Integer, ForeignKey("hall.id", ondelete="CASCADE"), nullable=False)
    row_number = Column(Integer, nullable=False)
    seat_number = Column(Integer, nullable=False)
    
    hall = relationship("Hall", back_populates="seats")
    tickets = relationship("Ticket", back_populates="seat")
    
    __table_args__ = (UniqueConstraint('hall_id', 'row_number', 'seat_number', name='_hall_row_seat_uc'),)

# Таблица сеансов
class Seance(Base):
    __tablename__ = "seance"
    id = Column(Integer, primary_key=True, index=True)
    film_id = Column(Integer, ForeignKey("film.id", ondelete="CASCADE"), nullable=False)
    hall_id = Column(Integer, ForeignKey("hall.id", ondelete="CASCADE"), nullable=False)
    start_date_time = Column(DateTime, nullable=False)
    base_price = Column(Numeric(10, 2), nullable=False)
    
    film = relationship("Film", back_populates="seances")
    hall = relationship("Hall", back_populates="seances")
    tickets = relationship("Ticket", back_populates="seance")

# Таблица билетов и транзакций
class Ticket(Base):
    __tablename__ = "ticket"
    id = Column(Integer, primary_key=True, index=True)
    seance_id = Column(Integer, ForeignKey("seance.id", ondelete="CASCADE"), nullable=False)
    seat_id = Column(Integer, ForeignKey("seat.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    sale_date_time = Column(DateTime, nullable=False, server_default=func.now())
    status = Column(String(20), nullable=False, default="Занято")
    
    seance = relationship("Seance", back_populates="tickets")
    seat = relationship("Seat", back_populates="tickets")
    user = relationship("User", back_populates="tickets")

    __table_args__ = (UniqueConstraint('seance_id', 'seat_id', name='_seance_seat_uc'),)
