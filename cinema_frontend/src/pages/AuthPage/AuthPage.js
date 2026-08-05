import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import Header from '../../components/Header';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(''); // Состояние для зеленого уведомления
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (isLogin) {
            try {
                const response = await API.post('/api/auth/login', { username, password });
                localStorage.setItem('token', response.data.access_token);
                localStorage.setItem('role', response.data.role);
                localStorage.setItem('user_id', response.data.user_id);
                localStorage.setItem('username', username);

                if (response.data.role === 'Администратор') navigate('/admin');
                else if (response.data.role === 'Кассир') navigate('/hall');
                else navigate('/');
            } catch (err) {
                setError(err.response?.data?.detail || 'Неверный логин или пароль');
            }
        } else {
            try {
                await API.post('/api/auth/register', { username, password });
                // Вместо alert записываем текст в success и переключаем на вход
                setSuccess('Регистрация прошла успешно! Теперь вы можете войти.');
                setIsLogin(true); 
                setUsername('');
                setPassword('');
            } catch (err) {
                setError(err.response?.data?.detail || 'Ошибка при регистрации');
            }
        }
    };

    return (
        <div style={{ background: '#121212', minHeight: '100vh', color: '#fff' }}>
            <Header />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '80px' }}>
                <div style={{ background: '#1e1e1e', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', border: '1px solid #292929', boxSizing: 'border-box' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '30px', marginTop: 0 }}>
                        {isLogin ? '🔑 Вход в систему' : '📝 Регистрация'}
                    </h2>

                    {error && (
                        <div style={{ background: '#dc3545', padding: '10px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    {/* Красивое зеленое уведомление без всплывающих окон */}
                    {success && (
                        <div style={{ background: '#28a745', padding: '10px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '14px' }}>Имя пользователя (Логин)</label>
                            <input 
                                type="text" 
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #333', background: '#222', color: '#fff', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '14px' }}>Пароль</label>
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #333', background: '#222', color: '#fff', boxSizing: 'border-box' }}
                            />
                        </div>

                        <button type="submit" style={{ width: '100%', padding: '12px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}>
                            {isLogin ? 'Войти' : 'Зарегистрироваться'}
                        </button>
                    </form>

                    <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '14px', color: '#aaa' }}>
                        {isLogin ? 'Впервые у нас?' : 'Уже есть аккаунт?'}
                        <span 
                            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
                            style={{ color: '#007bff', cursor: 'pointer', marginLeft: '6px', fontWeight: 'bold' }}
                        >
                            {isLogin ? 'Создать аккаунт' : 'Войти'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
