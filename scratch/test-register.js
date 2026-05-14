import axios from 'axios';

const test = async () => {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/customer/register', {
      firstName: 'Test',
      lastName: 'User',
      email: 'test' + Date.now() + '@example.com',
      mobile: '1234567890',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
};

test();
