import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
    const navigate = useNavigate();
    const role = localStorage.getItem('role'); // Проверяем, вошел ли кто-то

    const handleLogout = () => {
        localStorage.clear();
        navigate('/auth');
    };

    return (
        <header style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 30px', background: '#1a1a1a', color: '#fff', alignItems: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>🎬 BestCinema</Link>
            </div>
            <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Афиша</Link>
                <Link to="/schedule" style={{ color: '#fff', textDecoration: 'none' }}>Расписание</Link>
                
                {role === 'Посетитель' && <Link to="/cabinet" style={{ color: '#fff', textDecoration: 'none' }}>Личный кабинет</Link>}
                {role === 'Кассир' && <Link to="/hall" style={{ color: '#fff', textDecoration: 'none', background: '#28a745', padding: '5px 10px', borderRadius: '4px' }}>Касса</Link>}
                {role === 'Администратор' && <Link to="/admin" style={{ color: '#fff', textDecoration: 'none', background: '#dc3545', padding: '5px 10px', borderRadius: '4px' }}>Админка</Link>}

                {role ? (
                    <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #fff', color: '#fff', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px' }}>Выйти</button>
                ) : (
                    <Link to="/auth" style={{ color: '#fff', textDecoration: 'none', border: '1px solid #fff', padding: '5px 10px', borderRadius: '4px' }}>Войти</Link>
                )}
            </nav>
        </header>
    );
};

export default Header;
