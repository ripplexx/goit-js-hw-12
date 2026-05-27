import axios from 'axios';

const API_KEY = '55936108-136129e505e09c12d0f22cc5e'; // Buraya kendi anahtarını eklemelisin
const BASE_URL = 'https://pixabay.com/api/';

export async function fetchImages(query, page) {
  const url = `${BASE_URL}?key=${API_KEY}&q=${query}&image_type=photo&orientation=horizontal&safesearch=true&page=${page}&per_page=40`;
  
  const response = await axios.get(url);
  return response.data; 
}