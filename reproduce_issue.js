const axios = require('axios');

async function testLogin() {
    try {
        console.log('Attempting login...');
        const response = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'admin@dailyfoot.com', // Trying a likely email
            password: 'password123'
        });
        console.log('Login success:', response.status);
    } catch (error) {
        if (error.response) {
            console.log('Login failed with status:', error.response.status);
            console.log('Data:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
}

testLogin();
