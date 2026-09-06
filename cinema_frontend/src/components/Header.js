import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
    const navigate = useNavigate();
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');

    // Функция для выхода из аккаунта сотрудников и клиентов
    const handleLogout = () => {
        localStorage.clear(); // Полностью очищаем память сессии браузера
        navigate('/auth'); // Перенаправляем на экран авторизации
    };

    return (
        <header style={{ background: '#1a1a1a', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #292929' }}>
            {/* Логотип кинотеатра с переходом на главную афишу */}
            <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontSize: '24px', fontWeight: 'bold', letterSpacing: '1px' }}>
                🎬 BestCinema
            </Link>

            {/* Навигационное меню: Ссылки меняются динамически под Роль */}
            <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
                <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontSize: '15px' }}>Афиша</Link>
                
                {/* Показываем общее расписание всем, кроме Кассира */}
                {role !== 'Кассир' && (
                    <Link to="/schedule" style={{ color: '#fff', textDecoration: 'none', fontSize: '15px' }}>Расписание</Link>
                )}
                
                {/* Кассир видит строго одну выделенную кнопку "Касса" */}
                {role === 'Кассир' && (
                    <Link to="/schedule" style={{ color: '#fff', textDecoration: 'none', background: '#28a745', padding: '6px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>Касса</Link>
                )}
                
                {/* Обычный клиент (Посетитель) видит свой профиль */}
                {token && role === 'Посетитель' && (
                    <Link to="/cabinet" style={{ color: '#fff', textDecoration: 'none', background: '#007bff', padding: '6px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>Личный кабинет</Link>
                )}

                {/* Администратор видит пункт глобального управления кинотеатром */}
                {role === 'Администратор' && (
                    <Link to="/admin" style={{ color: '#000', textDecoration: 'none', background: '#ffc107', padding: '6px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>Панель администрирования</Link>
                )}
                
                {/* Кнопка Входа / Выхода в зависимости от авторизации */}
                {token ? (
                    <button 
                        onClick={handleLogout} 
                        style={{ background: 'transparent', border: '1px solid #444', color: '#aaa', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', transition: '0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#dc3545'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#aaa'; }}
                    >
                        Выйти
                    </button>
                ) : (
                    <Link to="/auth" style={{ color: '#fff', textDecoration: 'none', border: '1px solid #007bff', padding: '6px 14px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold' }}>Войти</Link>
                )}
            </div>
        </header>
    );
};

export default Header;
