import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import Header from '../../components/Header';

const AdminPage = () => {
    // Состояния для фильмов
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState('');
    const [ageRating, setAgeRating] = useState('12+');
    const [posterUrl, setPosterUrl] = useState('');

    // Состояния для сеансов
    const [films, setFilms] = useState([]);
    const [halls, setHalls] = useState([]);
    const [seances, setSeances] = useState([]);
    const [selectedFilm, setSelectedFilm] = useState('');
    const [selectedHall, setSelectedHall] = useState('');
    const [startDateTime, setStartDateTime] = useState('');
    const [basePrice, setBasePrice] = useState('');

    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Загружаем данные для выпадающих списков при открытии страницы
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const filmsRes = await API.get('/api/films');
            const hallsRes = await API.get('/api/halls');
            const seancesRes = await API.get('/api/seances');
            setFilms(filmsRes.data);
            setHalls(hallsRes.data);
            setSeances(seancesRes.data);
        } catch (err) {
            console.error('Ошибка загрузки данных в админку:', err);
        }
    };

    // Функция добавления фильма
    const handleCreateFilm = async (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setErrorMsg('');
        try {
            await API.post('/api/admin/films', {
                title,
                description,
                duration_min: parseInt(duration),
                age_rating: ageRating,
                poster_url: posterUrl
            });
            setSuccessMsg('Фильм успешно добавлен в систему!');
            setTitle(''); setDescription(''); setDuration(''); setPosterUrl('');
            loadData();
        } catch (err) {
            setErrorMsg('Ошибка при добавлении фильма');
        }
    };

    // Функция создания сеанса
    const handleCreateSeance = async (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setErrorMsg('');
        try {
            await API.post('/api/admin/seances', {
                film_id: parseInt(selectedFilm),
                hall_id: parseInt(selectedHall),
                start_date_time: startDateTime,
                base_price: parseFloat(basePrice)
            });
            setSuccessMsg('Сеанс успешно добавлен в расписание!');
            setStartDateTime(''); setBasePrice('');
            loadData();
        } catch (err) {
            setErrorMsg(err.response?.data?.detail || 'Ошибка при создании сеанса');
        }
    };

    // Функция удаления сеанса
    const handleDeleteSeance = async (id) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот сеанс?')) return;
        try {
            await API.delete(`/api/admin/seances/${id}`);
            setSuccessMsg('Сеанс успешно удален');
            loadData();
        } catch (err) {
            setErrorMsg('Ошибка при удалении сеанса');
        }
    };

    return (
        <div style={{ background: '#121212', minHeight: '100vh', color: '#fff', paddingBottom: '40px' }}>
            <Header />
            <div style={{ padding: '20px 40px', maxWidth: '1200px', margin: '0 auto' }}>
                <h1 style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>⚙️ Панель администратора</h1>

                {successMsg && <div style={{ background: '#28a745', padding: '12px', borderRadius: '6px', marginBottom: '20px', textAlign: 'center' }}>{successMsg}</div>}
                {errorMsg && <div style={{ background: '#dc3545', padding: '12px', borderRadius: '6px', marginBottom: '20px', textAlign: 'center' }}>{errorMsg}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '30px' }}>
                    
                    {/* Форма 1: Добавление фильма */}
                    <div style={{ background: '#1e1e1e', padding: '25px', borderRadius: '12px', border: '1px solid #292929' }}>
                        <h2 style={{ marginTop: 0, marginBottom: '20px' }}>🎬 Добавить новый фильм</h2>
                        <form onSubmit={handleCreateFilm} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input type="text" placeholder="Название фильма" required value={title} onChange={e => setTitle(e.target.value)} style={{ padding: '10px', background: '#222', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
                            <textarea placeholder="Описание" value={description} onChange={e => setDescription(e.target.value)} style={{ padding: '10px', background: '#222', border: '1px solid #333', color: '#fff', borderRadius: '6px', height: '80px', resize: 'none' }} />
                            <input type="number" placeholder="Длительность (в минутах)" required value={duration} onChange={e => setDuration(e.target.value)} style={{ padding: '10px', background: '#222', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
                            <input type="text" placeholder="Ссылка на постер (URL)" value={posterUrl} onChange={e => setPosterUrl(e.target.value)} style={{ padding: '10px', background: '#222', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
                            <div>
                                <label style={{ color: '#aaa', marginRight: '10px', fontSize: '14px' }}>Возрастной ценз:</label>
                                <select value={ageRating} onChange={e => setAgeRating(e.target.value)} style={{ padding: '10px', background: '#222', border: '1px solid #333', color: '#fff', borderRadius: '6px' }}>
                                    <option value="0+">0+</option>
                                    <option value="6+">6+</option>
                                    <option value="12+">12+</option>
                                    <option value="16+">16+</option>
                                    <option value="18+">18+</option>
                                </select>
                            </div>
                            <button type="submit" style={{ padding: '12px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Сохранить фильм</button>
                        </form>
                    </div>

                    {/* Форма 2: Создание сеанса */}
                    <div style={{ background: '#1e1e1e', padding: '25px', borderRadius: '12px', border: '1px solid #292929' }}>
                        <h2 style={{ marginTop: 0, marginBottom: '20px' }}>📅 Назначить сеанс</h2>
                        <form onSubmit={handleCreateSeance} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <select required value={selectedFilm} onChange={e => setSelectedFilm(e.target.value)} style={{ padding: '10px', background: '#222', border: '1px solid #333', color: '#fff', borderRadius: '6px' }}>
                                <option value="">-- Выберите фильм --</option>
                                {films.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                            </select>
                            <select required value={selectedHall} onChange={e => setSelectedHall(e.target.value)} style={{ padding: '10px', background: '#222', border: '1px solid #333', color: '#fff', borderRadius: '6px' }}>
                                <option value="">-- Выберите зрительный зал --</option>
                                {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                            </select>
                            <input type="datetime-local" required value={startDateTime} onChange={e => setStartDateTime(e.target.value)} style={{ padding: '10px', background: '#222', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
                            <input type="number" step="0.01" placeholder="Цена билета (руб.)" required value={basePrice} onChange={e => setBasePrice(e.target.value)} style={{ padding: '10px', background: '#222', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
                            <button type="submit" style={{ padding: '12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Добавить в расписание</button>
                        </form>
                    </div>
                </div>

                {/* Таблица текущего расписания сеансов */}
                <div style={{ marginTop: '40px', background: '#1e1e1e', padding: '25px', borderRadius: '12px', border: '1px solid #292929' }}>
                    <h2 style={{ marginTop: 0, marginBottom: '20px' }}>📋 Текущие сеансы в системе</h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #333', color: '#aaa' }}>
                                <th style={{ padding: '10px' }}>Фильм</th>
                                <th style={{ padding: '10px' }}>Зал</th>
                                <th style={{ padding: '10px' }}>Дата и время начала</th>
                                <th style={{ padding: '10px' }}>Цена билета</th>
                                <th style={{ padding: '10px' }}>Действие</th>
                            </tr>
                        </thead>
                        <tbody>
                            {seances.map(s => (
                                <tr key={s.id} style={{ borderBottom: '1px solid #222' }}>
                                    <td style={{ padding: '10px', fontWeight: 'bold' }}>
                                        {s.film?.title}
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        {s.hall?.name}
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        {new Date(s.start_date_time).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '10px', color: '#28a745', fontWeight: 'bold' }}>
                                        {s.base_price} руб.
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        <button 
                                            onClick={() => handleDeleteSeance(s.id)} 
                                            style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            Удалить
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {seances.length === 0 && (
                        <p style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>
                            Сеансы еще не добавлены...
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
