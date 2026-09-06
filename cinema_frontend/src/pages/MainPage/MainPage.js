import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import Header from '../../components/Header';

const MainPage = () => {
    const [films, setFilms] = useState([]);
    const [seances, setSeances] = useState([]); // Добавили состояние для сеансов
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Параллельно загружаем фильмы и сеансы из базы данных i41_glazyrina
        Promise.all([
            API.get('/api/films'),
            API.get('/api/seances')
        ])
        .then(([filmsRes, seancesRes]) => {
            setFilms(filmsRes.data);
            setSeances(seancesRes.data);
        })
        .catch(error => console.error('Ошибка загрузки афиши и расписания:', error));
    }, []);

    const filteredFilms = films.filter(film => 
        film.title.toLowerCase().includes(search.toLowerCase())
    );

    // Функция проверки: есть ли у конкретного фильма хотя бы один сеанс
    const hasSeances = (filmId) => {
        return seances.some(seance => seance.film_id === filmId);
    };

    return (
        <div style={{ background: '#121212', minHeight: '100vh', color: '#fff' }}>
            <Header />
            <div style={{ padding: '4px 40px', maxWidth: '1200px', margin: '0 auto' }}>
                <h1 style={{ marginTop: '20px' }}>Сейчас в прокате</h1>
                
                <input 
                    type="text" 
                    placeholder="Поиск фильма по названию..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#fff', marginBottom: '30px', boxSizing: 'border-box' }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '30px' }}>
                    {filteredFilms.map(film => {
                        const isAvailable = hasSeances(film.id); // Проверяем доступность сеансов
                        
                        return (
                            <div key={film.id} style={{ background: '#1e1e1e', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid #292929', overflow: 'hidden' }}>
                                <div>
                                    <img 
                                        src={film.poster_url || 'https://afisha.ru'} 
                                        alt={film.title}
                                        style={{ width: '100%', height: '320px', objectFit: 'cover', borderRadius: '8px', marginBottom: '15px', background: '#222', filter: isAvailable ? 'none' : 'grayscale(60%)' }}
                                        onError={(e) => { e.target.src = 'https://afisha.ru'; }}
                                    />
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>{film.title}</h3>
                                    <p style={{ color: '#aaa', fontSize: '14px', height: '60px', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '15px' }}>{film.description}</p>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '14px', marginBottom: '15px' }}>
                                        <span>⏱ {film.duration_min} мин.</span>
                                        <span style={{ background: '#007bff', padding: '2px 8px', borderRadius: '4px', color: '#fff', fontWeight: 'bold' }}>{film.age_rating}</span>
                                    </div>
                                    
                                    {isAvailable ? (
                                        <button 
                                            onClick={() => navigate('/schedule', { state: { filterFilmId: film.id } })}
                                            style={{ width: '100%', padding: '12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
                                        >
                                            Смотреть сеансы
                                        </button>
                                    ) : (
                                        <div style={{ width: '100%', padding: '11px', background: '#291415', color: '#dc3545', border: '1px solid #dc3545', borderRadius: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', boxSizing: 'border-box' }}>
                                            ❌ Нет активных сеансов
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredFilms.length === 0 && (
                    <p style={{ color: '#888', textAlign: 'center', marginTop: '40px', fontSize: '16px' }}>Фильмы не найдены или список пуст. Попробуйте ввести другое название.</p>
                )}
            </div>
        </div>
    );
};

export default MainPage;
