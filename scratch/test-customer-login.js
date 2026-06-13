import axios from 'axios';

const test = async () => {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test1781373504342@example.com',
      password: 'Password123!',
      portal: 'customer'
    }, {
      headers: {
        'X-Portal': 'customer'
      }
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
};

test();
