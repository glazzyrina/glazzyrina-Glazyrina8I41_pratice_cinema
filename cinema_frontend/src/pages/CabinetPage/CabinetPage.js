import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import Header from '../../components/Header';

const CabinetPage = () => {
    const [tickets, setTickets] = useState([]);
    const [error, setError] = useState('');
    const username = localStorage.getItem('username') || 'Посетитель';

    const loadTickets = () => {
        const currentUsername = localStorage.getItem('username');
        API.get(`/api/tickets/my?username=${currentUsername}`)
            .then(response => {
                setTickets(response.data);
                setError(''); 
            })
            .catch(err => {
                console.error('Ошибка загрузки билетов:', err);
                setError('Не удалось подключиться к серверу расписания.');
            });
    };

    useEffect(() => {
        loadTickets();
    }, []);

    // Функция отмены бронирования
    const handleCancelBooking = async (ticketId) => {
        if (!window.confirm('Вы уверены, что хотите отменить бронирование этого билета?')) return;
        
        try {
            await API.delete(`/api/tickets/${ticketId}`);
            loadTickets(); // Перезагружаем билеты, чтобы отмененный плавно исчез с экрана
        } catch (err) {
            console.error('Ошибка при отмене билета:', err);
            setError('Не удалось отменить бронирование.');
        }
    };

    return (
        <div style={{ background: '#121212', minHeight: '100vh', color: '#fff', paddingBottom: '40px' }}>
            <Header />
            <div style={{ padding: '20px 40px', maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ marginTop: '20px', marginBottom: '10px' }}>👤 Личный кабинет</h1>
                <p style={{ color: '#aaa', marginBottom: '40px', marginTop: 0 }}>
                    Добро пожаловать, <strong style={{ color: '#007bff' }}>{username}</strong>! Здесь отображаются ваши забронированные билеты.
                </p>

                {error && (
                    <div style={{ background: '#dc3545', padding: '12px', borderRadius: '6px', marginBottom: '20px', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <h2 style={{ fontSize: '20px', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                    🎟 Мои бронирования
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {tickets.map(ticket => (
                        <div key={ticket.id} style={{ background: '#1e1e1e', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #292929', borderLeft: '5px solid #fd7e14' }}>
                            <div>
                                <h3 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>{ticket.seance?.film?.title}</h3>
                                <div style={{ display: 'flex', gap: '20px', color: '#aaa', fontSize: '14px' }}>
                                    <span>📍 Зал: <strong style={{ color: '#fff' }}>{ticket.seance?.hall?.name}</strong></span>
                                    <span>📅 Дата: <strong style={{ color: '#fff' }}>{new Date(ticket.seance?.start_date_time).toLocaleDateString('ru-RU')}</strong></span>
                                    <span>🕒 Время: <strong style={{ color: '#ffc107' }}>{new Date(ticket.seance?.start_date_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</strong></span>
                                </div>
                                <div style={{ marginTop: '12px', fontSize: '15px' }}>
                                    🟩 Место: <strong>Ряд {ticket.seat?.row_number}, Кресло {ticket.seat?.seat_number}</strong>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                                <span style={{ background: 'rgba(253, 126, 20, 0.1)', color: '#fd7e14', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>
                                    ⏳ {ticket.status}
                                </span>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>{parseInt(ticket.seance?.base_price)} ₽</div>
                                
                                {/* Кнопка отмены */}
                                <button 
                                    onClick={() => handleCancelBooking(ticket.id)}
                                    style={{ background: 'transparent', border: '1px solid #dc3545', color: '#dc3545', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', marginTop: '5px', transition: '0.2s' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#dc3545'; e.currentTarget.style.color = '#fff'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#dc3545'; }}
                                >
                                    🗑 Отменить бронь
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {tickets.length === 0 && !error && (
                    <div style={{ textAlign: 'center', marginTop: '50px', padding: '30px', background: '#1e1e1e', borderRadius: '12px', border: '1px solid #292929' }}>
                        <div style={{ fontSize: '40px', marginBottom: '15px' }}>🎫</div>
                        <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>Бронирования отсутствуют</h3>
                        <p style={{ color: '#888', margin: 0, fontSize: '15px' }}>Вы еще не забронировали ни одного места. Самое время выбрать фильм на афише!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CabinetPage;

