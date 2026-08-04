import axios from 'axios';

// Настраиваем базовый адрес к нашему бэкенду на FastAPI
const API = axios.create({
    baseURL: 'http://localhost:8080',
});

export default API;