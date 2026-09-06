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
    const [editingFilmId, setEditingFilmId] = useState(null);

    // Состояния для сеансов
    const [films, setFilms] = useState([]);
    const [halls, setHalls] = useState([]);
    const [seances, setSeances] = useState([]);
    const [selectedFilm, setSelectedFilm] = useState('');
    const [selectedHall, setSelectedHall] = useState('');
    const [startDateTime, setStartDateTime] = useState('');
    const [basePrice, setBasePrice] = useState('');
    const [editingSeanceId, setEditingSeanceId] = useState(null);

    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

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
            console.error('Ошибка загрузки данных в панель управления:', err);
        }
    };

    // Функция добавления/обновления фильма
    const handleSaveFilm = async (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setErrorMsg('');
        
        const payload = {
            title,
            description,
            duration_min: parseInt(duration),
            age_rating: ageRating,
            poster_url: posterUrl
        };

        try {
            if (editingFilmId) {
                await API.put(`/api/admin/films/${editingFilmId}`, payload);
                setSuccessMsg('Данные фильма успешно обновлены!');
                setEditingFilmId(null);
            } else {
                await API.post('/api/admin/films', payload);
                setSuccessMsg('Фильм успешно добавлен в систему!');
            }
            setTitle(''); setDescription(''); setDuration(''); setPosterUrl(''); setAgeRating('12+');
            loadData();
        } catch (err) {
            setErrorMsg('Ошибка при сохранении фильма');
        }
    };

    const startEditFilm = (film) => {
        setEditingFilmId(film.id);
        setTitle(film.title);
        setDescription(film.description || '');
        setDuration(film.duration_min);
        setAgeRating(film.age_rating);
        setPosterUrl(film.poster_url || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteFilm = async (id) => {
        if (!window.confirm('Внимание! При удалении фильма удалятся и все его сеансы. Продолжить?')) return;
        try {
            await API.delete(`/api/admin/films/${id}`);
            setSuccessMsg('Фильм успешно удален из афиши');
            if (editingFilmId === id) setEditingFilmId(null);
            loadData();
        } catch (err) {
            setErrorMsg('Ошибка при удалении фильма');
        }
    };

    // Функция добавления/обновления сеанса
    const handleSaveSeance = async (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setErrorMsg('');
        
        const payload = {
            film_id: parseInt(selectedFilm),
            hall_id: parseInt(selectedHall),
            start_date_time: startDateTime,
            base_price: parseFloat(basePrice)
        };

        try {
            if (editingSeanceId) {
                await API.put(`/api/admin/seances/${editingSeanceId}`, payload);
                setSuccessMsg('Сеанс успешно изменен и обновлен!');
                setEditingSeanceId(null);
            } else {
                await API.post('/api/admin/seances', payload);
                setSuccessMsg('Сеанс успешно добавлен в расписание!');
            }
            setSelectedFilm(''); setSelectedHall(''); setStartDateTime(''); setBasePrice('');
            loadData();
        } catch (err) {
            setErrorMsg(err.response?.data?.detail || 'Ошибка при сохранении сеанса');
        }
    };

    const startEditSeance = (seance) => {
        setEditingSeanceId(seance.id);
        setSelectedFilm(seance.film_id);
        setSelectedHall(seance.hall_id);
        setStartDateTime(seance.start_date_time.substring(0, 16));
        setBasePrice(seance.base_price);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

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
                <h1 style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>⚙️ Панель администрирования</h1>

                {successMsg && <div style={{ background: '#28a745', padding: '12px', borderRadius: '6px', marginBottom: '20px', textAlign: 'center' }}>{successMsg}</div>}
                {errorMsg && <div style={{ background: '#dc3545', padding: '12px', borderRadius: '6px', marginBottom: '20px', textAlign: 'center' }}>{errorMsg}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '30px' }}>
                    
                    {/* Форма 1: Управление фильмом */}
                    <div style={{ background: '#1e1e1e', padding: '25px', borderRadius: '12px', border: editingFilmId ? '1px solid #ffc107' : '1px solid #292929' }}>
                        <h2 style={{ marginTop: 0, marginBottom: '20px', color: editingFilmId ? '#ffc107' : '#fff' }}>
                            {editingFilmId ? '📝 Редактировать фильм' : '🎬 Добавить новый фильм'}
                        </h2>
                        <form onSubmit={handleSaveFilm} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" style={{ flex: 1, padding: '12px', background: editingFilmId ? '#ffc107' : '#007bff', color: editingFilmId ? '#000' : '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    {editingFilmId ? 'Сохранить изменения' : 'Сохранить фильм'}
                                </button>
                                {editingFilmId && <button type="button" onClick={() => { setEditingFilmId(null); setTitle(''); setDescription(''); setDuration(''); setPosterUrl(''); }} style={{ padding: '12px', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Отмена</button>}
                            </div>
                        </form>
                    </div>

                    {/* Форма 2: Назначение / Редактирование сеанса */}
                    <div style={{ background: '#1e1e1e', padding: '25px', borderRadius: '12px', border: editingSeanceId ? '1px solid #ffc107' : '1px solid #292929' }}>
                        <h2 style={{ marginTop: 0, marginBottom: '20px', color: editingSeanceId ? '#ffc107' : '#fff' }}>
                            {editingSeanceId ? '📝 Редактировать сеанс' : '📅 Назначить сеанс'}
                        </h2>
                        <form onSubmit={handleSaveSeance} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" style={{ flex: 1, padding: '12px', background: editingSeanceId ? '#28a745' : '#007bff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    {editingSeanceId ? 'Обновить сеанс' : 'Добавить в расписание'}
                                </button>
                                {editingSeanceId && <button type="button" onClick={() => { setEditingSeanceId(null); setSelectedFilm(''); setSelectedHall(''); setStartDateTime(''); setBasePrice(''); }} style={{ padding: '12px', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Отмена</button>}
                            </div>
                        </form>
                    </div>
                </div>

                {/* ТАБЛИЦА 1: Управление Фильмами в афише */}
                <div style={{ marginTop: '40px', background: '#1e1e1e', padding: '25px', borderRadius: '12px', border: '1px solid #292929' }}>
                    <h2 style={{ marginTop: 0, marginBottom: '20px' }}>📋 Фильмы в текущем прокате</h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #333', color: '#aaa' }}>
                                <th style={{ padding: '10px' }}>Миниатюра</th>
                                <th style={{ padding: '10px' }}>Название</th>
                                <th style={{ padding: '10px' }}>Хронометраж</th>
                                <th style={{ padding: '10px' }}>Ценз</th>
                                <th style={{ padding: '10px' }}>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {films.map(f => (
                                <tr key={f.id} style={{ borderBottom: '1px solid #222', background: editingFilmId === f.id ? 'rgba(255, 193, 7, 0.1)' : 'transparent' }}>
                                    <td style={{ padding: '10px' }}>
                                        <img src={f.poster_url || 'https://afisha.ru'} alt="" style={{ width: '45px', height: '60px', objectFit: 'cover', borderRadius: '4px', background: '#222' }} />
                                    </td>
                                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{f.title}</td>
                                    <td style={{ padding: '10px' }}>{f.duration_min} мин.</td>
                                    <td style={{ padding: '10px', color: '#007bff', fontWeight: 'bold' }}>{f.age_rating}</td>
                                    <td style={{ padding: '10px' }}>
                                        <button onClick={() => startEditFilm(f)} style={{ background: '#ffc107', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px' }}>✏️ Редактировать</button>
                                        <button onClick={() => handleDeleteFilm(f.id)} style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>🗑 Удалить фильм</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* ТАБЛИЦА 2: Управление Расписанием Сеансов */}
                <div style={{ marginTop: '40px', background: '#1e1e1e', padding: '25px', borderRadius: '12px', border: '1px solid #292929' }}>
                    <h2 style={{ marginTop: 0, marginBottom: '20px' }}>📋 Текущие сеансы в системе</h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #333', color: '#aaa' }}>
                                <th style={{ padding: '10px' }}>Фильм</th>
                                <th style={{ padding: '10px' }}>Зал</th>
                                <th style={{ padding: '10px' }}>Дата и время начала</th>
                                <th style={{ padding: '10px' }}>Цена билета</th>
                                <th style={{ padding: '10px' }}>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {seances.map(s => (
                                <tr key={s.id} style={{ borderBottom: '1px solid #222', background: editingSeanceId === s.id ? 'rgba(40, 167, 69, 0.1)' : 'transparent' }}>
                                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{s.film?.title}</td>
                                    <td style={{ padding: '10px' }}>{s.hall?.name}</td>
                                    <td style={{ padding: '10px' }}>{new Date(s.start_date_time).toLocaleString()}</td>
                                    <td style={{ padding: '10px', color: '#28a745', fontWeight: 'bold' }}>{s.base_price} руб.</td>
                                    <td style={{ padding: '10px' }}>
                                        <button onClick={() => startEditSeance(s)} style={{ background: '#ffc107', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px' }}>✏️ Редактировать</button>
                                        <button onClick={() => handleDeleteSeance(s.id)} style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>🗑 Удалить</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {seances.length === 0 && <p style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>Сеансы еще не добавлены...</p>}
                </div>

            </div>
        </div>
    );
};

export default AdminPage;
