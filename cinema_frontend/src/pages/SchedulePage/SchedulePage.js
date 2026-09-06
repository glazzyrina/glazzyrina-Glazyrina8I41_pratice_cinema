import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../../services/api';
import Header from '../../components/Header';

const SchedulePage = () => {
    const [seances, setSeances] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    
    // Извлекаем ID фильма из состояния маршрута, если переход был с конкретной карточки афиши
    const filterFilmId = location.state?.filterFilmId;

    useEffect(() => {
        // Запрос к FastAPI для получения всех сеансов из базы данных i41_glazyrina
        API.get('/api/seances')
            .then(response => {
                setSeances(response.data);
                // По умолчанию выбираем дату самого первого сеанса, если они есть
                if (response.data.length > 0) {
                    const firstDate = response.data[0].start_date_time.split('T')[0];
                    setSelectedDate(firstDate);
                }
            })
            .catch(error => console.error('Ошибка загрузки расписания:', error));
    }, []);

    // Получаем список уникальных дат для кнопок-фильтров
    const uniqueDates = [...new Set(seances.map(s => s.start_date_time.split('T')[0]))].sort();

    // Сначала фильтруем сеансы по выбранной пользователем дате календаря
    let filteredSeances = seances.filter(s => s.start_date_time.split('T')[0] === selectedDate);

    // Если пришли с карточки конкретного фильма — дополнительно оставляем только его сеансы
    if (filterFilmId) {
        filteredSeances = filteredSeances.filter(s => s.film_id === filterFilmId);
    }

    // Группируем отфильтрованные сеансы по фильмам, чтобы они не дублировались списками
    const seancesByFilm = filteredSeances.reduce((acc, seance) => {
        const filmId = seance.film.id;
        if (!acc[filmId]) {
            acc[filmId] = {
                film: seance.film,
                list: []
            };
        }
        acc[filmId].list.push(seance);
        return acc;
    }, {});

    return (
        <div style={{ background: '#121212', minHeight: '100vh', color: '#fff', paddingBottom: '40px' }}>
            <Header />
            <div style={{ padding: '20px 40px', maxWidth: '1000px', margin: '0 auto' }}>
                <h1 style={{ marginTop: '20px', marginBottom: '30px' }}>📅 Расписание киносеансов</h1>

                {/* Лента дат (Кнопки переключения дней) */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '40px', overflowX: 'auto', paddingBottom: '10px' }}>
                    {uniqueDates.map(date => {
                        const formattedDate = new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' });
                        const isActive = date === selectedDate;
                        return (
                            <button
                                key={date}
                                onClick={() => setSelectedDate(date)}
                                style={{
                                    padding: '12px 20px',
                                    background: isActive ? '#28a745' : '#1e1e1e',
                                    color: '#fff',
                                    border: isActive ? 'none' : '1px solid #333',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap',
                                    transition: '0.2s'
                                }}
                            >
                                {formattedDate}
                            </button>
                        );
                    })}
                </div>

                {/* Список фильмов и их сеансов на выбранный день */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    {Object.values(seancesByFilm).map(({ film, list }) => (
                        <div key={film.id} style={{ background: '#1e1e1e', borderRadius: '12px', padding: '25px', display: 'flex', gap: '25px', border: '1px solid #292929', alignItems: 'center' }}>
                            {/* Маленький постер слева */}
                            <img 
                                src={film.poster_url || 'https://afisha.ru'} 
                                alt={film.title} 
                                style={{ width: '100px', height: '140px', objectFit: 'cover', borderRadius: '6px', background: '#222' }}
                            />
                            
                            {/* Информационный блок */}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                    <h2 style={{ margin: 0, fontSize: '22px' }}>{film.title}</h2>
                                    <span style={{ background: '#007bff', padding: '2px 6px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>{film.age_rating}</span>
                                    <span style={{ color: '#888', fontSize: '14px' }}>⏱ {film.duration_min} мин.</span>
                                </div>

                                {/* Сетка доступного времени для этого фильма */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                                    {list.sort((a,b) => a.start_date_time.localeCompare(b.start_date_time)).map(seance => {
                                        const timeStr = new Date(seance.start_date_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                                        return (
                                            <div 
                                                key={seance.id}
                                                onClick={() => navigate('/hall', { state: { seanceId: seance.id } })}
                                                style={{
                                                    background: '#292929',
                                                    border: '1px solid #3c3c3c',
                                                    borderRadius: '8px',
                                                    padding: '10px 15px',
                                                    cursor: 'pointer',
                                                    textAlign: 'center',
                                                    transition: '0.2s',
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ffc107'}
                                                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#3c3c3c'}
                                            >
                                                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>{timeStr}</div>
                                                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{seance.hall?.name}</div>
                                                <div style={{ fontSize: '12px', color: '#28a745', fontWeight: 'bold', marginTop: '4px' }}>{parseInt(seance.base_price)} ₽</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredSeances.length === 0 && (
                    <p style={{ color: '#888', textAlign: 'center', marginTop: '40px', fontSize: '16px' }}>
                        {filterFilmId 
                            ? "На этот фильм сегодня больше нет доступных сеансов." 
                            : "Расписание на выбранный день временно пусто."}
                    </p>
                )}
            </div>
        </div>
    );
};

export default SchedulePage;
