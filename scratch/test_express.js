import express from 'express';

const app = express();

const adminRoutes = express.Router();
adminRoutes.get('/sellers', (req, res) => res.send('sellers'));

const layoutRoutes = express.Router();
layoutRoutes.post('/admin/featured-products', (req, res) => res.send('layout post'));

app.use('/api/admin', adminRoutes);
app.use('/api', layoutRoutes);

app.use((req, res) => {
  res.status(404).send('Not Found');
});

const server = app.listen(3003, () => {
  console.log('Test server running on port 3003');
  
  // Call the endpoint using fetch
  fetch('http://localhost:3003/api/admin/featured-products', { method: 'POST' })
    .then(r => r.text())
    .then(text => {
      console.log('RESPONSE:', text);
      server.close();
    })
    .catch(err => {
      console.error(err);
      server.close();
    });
});
