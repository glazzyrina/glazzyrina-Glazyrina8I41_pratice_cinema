import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import Header from '../../components/Header';

const HallPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const seanceId = location.state?.seanceId;

    const [seanceInfo, setSeanceInfo] = useState(null);
    const [seats, setSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const userRole = localStorage.getItem('role');

    const loadHallData = async () => {
        try {
            const response = await API.get(`/api/seances/${seanceId}/seats`);
            setSeats(response.data.seats || response.data); 
            
            const seancesRes = await API.get('/api/seances');
            const currentSeance = seancesRes.data.find(s => s.id === seanceId);
            setSeanceInfo(currentSeance);
        } catch (err) {
            setError('Не удалось загрузить схему зала.');
        }
    };

    useEffect(() => {
        if (!seanceId) {
            navigate('/schedule');
            return;
        }
        loadHallData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seanceId]);

    const handleSeatClick = (seat) => {
        if (userRole !== 'Кассир' && seat.status !== 'Свободно') return;

        if (seat.status !== 'Свободно') {
            setSelectedSeats([seat]);
            return;
        }


        const hasBusySeats = selectedSeats.some(s => s.status !== 'Свободно');
        let currentSelected = hasBusySeats ? [] : [...selectedSeats];

        const isAlreadySelected = currentSelected.some(s => s.row_number === seat.row_number && s.seat_number === seat.seat_number);

        if (isAlreadySelected) {
            // Если место уже было выбрано — убираем его из списка по координатам
            setSelectedSeats(currentSelected.filter(s => !(s.row_number === seat.row_number && s.seat_number === seat.seat_number)));
        } else {
            // Иначе добавляем новое свободное кресло в список мультивыбора
            setSelectedSeats([...currentSelected, seat]);
        }
    };

    const handleAction = async (actionType) => {
        if (selectedSeats.length === 0) {
            setError('Пожалуйста, выберите хотя бы одно кресло.');
            return;
        }
        setError('');
        setSuccess('');

        let url = actionType === 'sell' ? '/api/tickets/sell' : '/api/tickets/book';

        try {
            const savedUserId = localStorage.getItem('user_id');

            for (const seat of selectedSeats) {
                await API.post(url, { 
                    seance_id: Number(seanceId), 
                    seat_id: Number(seat.seat_id || seat.id), // Проверяем оба варианта ключа места
                    user_id: savedUserId ? Number(savedUserId) : 1 // Если ID пустой, передаем 1 (как дефолтного посетителя)
                });
            }
            setSuccess(actionType === 'sell' ? 'Билеты успешно оформлены!' : 'Места забронированы!');
            setSelectedSeats([]);
            loadHallData();
        } catch (err) {
            console.error("Детали ошибки 422:", err.response?.data);
            setError('Ошибка при оформлении мест. Проверьте типы данных.');
        }

    };

    const handleCancelTicket = async () => {
        if (selectedSeats.length === 0) return;
        const targetSeat = selectedSeats[0]; 
        if (!targetSeat || targetSeat.status === 'Свободно') return;
        if (!window.confirm(`Аннулировать билет: Ряд ${targetSeat.row_number} Место ${targetSeat.seat_number} и вернуть в продажу?`)) return;

        try {
            await API.post('/api/tickets/cancel', {
                seance_id: Number(seanceId),
                seat_id: Number(targetSeat.seat_id || targetSeat.id) // Проверяем оба ключа
            });
            setSuccess('Билет успешно аннулирован!');
            setSelectedSeats([]);
            loadHallData(); 
        } catch (err) {
            console.error("Ошибка отмены билета кассиром:", err.response?.data);
            setError('Не удалось аннулировать билет.');
        }
    };


    const getSeatColor = (seat) => {
        // Подсвечиваем желтым только если совпадают и ряд, и место
        const isCurrent = selectedSeats.some(s => s.row_number === seat.row_number && s.seat_number === seat.seat_number);
        if (isCurrent) return '#ffc107';

        if (seat.status === 'Занято') return '#dc3545';
        if (seat.status === 'Забронировано') return '#fd7e14';
        return '#28a745';
    };

    const isVip = seanceInfo?.hall?.name?.includes('VIP');

    // Группируем места по рядам автоматически на основе данных из базы
    const seatsByRow = seats.reduce((acc, seat) => {
        if (!acc[seat.row_number]) acc[seat.row_number] = [];
        acc[seat.row_number].push(seat);
        return acc;
    }, {});

    // Извлекаем только существующие ряды и сортируем их от большего к меньшему
    const existingRows = Object.keys(seatsByRow).map(Number).sort((a, b) => b + a);

    return (
        <div style={{ background: '#121212', minHeight: '100vh', color: '#fff', paddingBottom: '40px' }}>
            <Header />
            {seanceInfo && (
                <div style={{ padding: '20px 40px', maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '40px', marginTop: '20px' }}>
                    
                    {/* Схема кресел */}
                    <div style={{ flex: 2, background: '#1e1e1e', padding: '30px', borderRadius: '12px', border: '1px solid #292929', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '80%', height: '8px', background: '#3b82f6', borderRadius: '4px', boxShadow: '0 4px 20px rgba(59, 130, 246, 0.5)', marginBottom: '10px' }} />
                        <div style={{ color: '#555', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '50px' }}>Экран {isVip && '(VIP Зал)'}</div>

                        {/* Автоматическая отрисовка реальной сетки зала */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: isVip ? '25px' : '15px', width: '100%' }}>
                            {existingRows.map(row => (
                                <div key={row} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                                    <span style={{ color: '#555', fontSize: '14px', width: '60px', textAlign: 'right' }}>Ряд {row}</span>
                                    
                                    <div style={{ display: 'flex', gap: isVip ? '20px' : '10px' }}>
                                        {seatsByRow[row].sort((a, b) => a.seat_number - b.seat_number).map(seat => (
                                            <button
                                                key={seat.id}
                                                onClick={() => handleSeatClick(seat)}
                                                // Кассиру блокировать кнопки нельзя, он должен уметь нажимать на любые места для возврата!
                                                disabled={userRole !== 'Кассир' && seat.status !== 'Свободно'}
                                                style={{
                                                    width: isVip ? '42px' : '35px',
                                                    height: isVip ? '42px' : '35px',
                                                    background: getSeatColor(seat),
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    // Для кассира курсор всегда будет кликабельным указателем (pointer)
                                                    cursor: (userRole === 'Кассир' || seat.status === 'Свободно') ? 'pointer' : 'not-allowed',
                                                    color: '#fff',
                                                    fontWeight: 'bold',
                                                    fontSize: isVip ? '14px' : '12px',
                                                    // Для кассира все кресла остаются яркими и сочными
                                                    opacity: (userRole === 'Кассир' || seat.status === 'Свободно') ? 1 : 0.4
                                                }}
                                            >
                                                {seat.seat_number}
                                            </button>
                                        ))}
                                    </div>
                                    <span style={{ color: '#555', fontSize: '14px', width: '60px' }}>Ряд {row}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '20px', marginTop: '50px', fontSize: '14px', color: '#aaa' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '16px', height: '16px', background: '#28a745', borderRadius: '4px' }} /> Свободно</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '16px', height: '16px', background: '#ffc107', borderRadius: '4px' }} /> Выбрано</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '16px', height: '16px', background: '#fd7e14', borderRadius: '4px' }} /> Забронировано</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '16px', height: '16px', background: '#dc3545', borderRadius: '4px' }} /> Продано</div>
                        </div>
                    </div>

                    {/* Боковая панель оформления заказа */}
                    <div style={{ flex: 1, background: '#1e1e1e', padding: '25px', borderRadius: '12px', border: '1px solid #292929', height: 'fit-content' }}>
                        <h2 style={{ marginTop: 0, fontSize: '22px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>🛒 Оформление</h2>
                        
                        <div style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '15px' }}>
                            <p style={{ margin: 0 }}>🎬 Фильм: <strong style={{ color: '#fff' }}>{seanceInfo.film?.title}</strong></p>
                            <p style={{ margin: 0 }}>📍 Зал: <strong style={{ color: isVip ? '#ffc107' : '#fff' }}>{seanceInfo.hall?.name}</strong></p>
                            <p style={{ margin: 0 }}>🕒 Начало: <strong style={{ color: '#ffc107' }}>{new Date(seanceInfo.start_date_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</strong></p>
                            <p style={{ margin: 0 }}>📅 Дата: <strong>{new Date(seanceInfo.start_date_time).toLocaleDateString('ru-RU')}</strong></p>
                        </div>

                        <div style={{ background: '#121212', borderRadius: '8px', padding: '15px', margin: '20px 0' }}>
                            <span style={{ color: '#aaa', fontSize: '14px' }}>Выбранные места:</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                                {selectedSeats.map(s => (
                                    <span key={s.id} style={{ background: '#333', padding: '4px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                                        Р{s.row_number} М{s.seat_number}
                                    </span>
                                ))}
                                {selectedSeats.length === 0 && <span style={{ color: '#555', fontSize: '13px' }}>Места не выбраны...</span>}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '18px', fontWeight: 'bold', margin: '25px 0' }}>
                            <span>Итого к оплате:</span>
                            <span style={{ color: '#28a745', fontSize: '24px' }}>{selectedSeats.length * parseInt(seanceInfo.base_price)} ₽</span>
                        </div>

                        {error && <div style={{ background: '#dc3545', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
                        {success && <div style={{ width: '100%', background: '#28a745', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px', textAlign: 'center', boxSizing: 'border-box' }}>{success}</div>}

                        {userRole === 'Кассир' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {selectedSeats[0]?.status === 'Свободно' || selectedSeats.length === 0 ? (
                                    <button onClick={() => handleAction('sell')} style={{ width: '100%', padding: '14px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
                                        💵 Оформить продажу
                                    </button>
                                ) : (
                                    <button onClick={handleCancelTicket} style={{ width: '100%', padding: '14px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
                                        ❌ Аннулировать / Возврат билета
                                    </button>
                                )}
                            </div>
                        ) : (                        
                            <button onClick={() => handleAction('book')} style={{ width: '100%', padding: '14px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
                                🔒 Забронировать места
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HallPage;
