from passlib.context import CryptContext

# Настраиваем алгоритм bcrypt для автоматического хэширования с солью
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Превращает чистый пароль в хэш с солью для записи в БД
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# Сравнивает введенный при входе пароль с хэшем из базы данных
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
