import axios from 'axios';

const API_URL = 'http://localhost:5000/api/appointments';

// Helper function to dynamically grab the token and set authorization headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token'); 
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const fetchAppointments = async () => {
  try {
    const response = await axios.get(API_URL, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error fetching appointments from server:', error);
    throw error.response?.data || error.message;
  }
};

export const createAppointment = async (appointmentData) => {
  try {
    const response = await axios.post(API_URL, appointmentData, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error.response?.data || error.message;
  }
};