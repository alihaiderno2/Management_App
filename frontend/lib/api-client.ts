import axios from 'axios';
export const apiClient = axios.create({
    baseURL: 'http://localhost:3001/v1',
    withCredentials: true, // Includes cookies in requests
});