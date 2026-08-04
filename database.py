from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Строка подключения к вашей БД в pgAdmin. 
DATABASE_URL = "postgresql+psycopg://postgres:Qawsed123@localhost:5432/i41_glazyrina"

# Создаем движок для отправки запросов в базу данных
engine = create_engine(DATABASE_URL)

# Создаем фабрику сессий для работы с данными
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовый класс, от которого мы будем создавать таблицы в коде Python
Base = declarative_base()

# Функция, которая будет открывать и закрывать соединение с БД при каждом запросе
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()