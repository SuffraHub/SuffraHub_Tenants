

const express = require('express');
const app = express();
const port = 8001;

const cors = require('cors');
require('dotenv').config();
const mysql = require('mysql');

app.use(cors());
app.use(express.json());

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

connection.connect(err => {
  if (err) {
    console.error('DB connection error:', err.stack);
    return;
  }
  console.log('Connected to MySQL');
});

// === 1. Pobierz dane firmy (dzierżawy) ===
app.get('/tenant-info/:company_id', (req, res) => {
  const { company_id } = req.params;

  connection.query(
    'SELECT name, description FROM tenants WHERE id = ?',
    [company_id],
    (err, results) => {
      if (err) {
        console.error('DB error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Company not found' });
      }

      res.json({ companyInfo: results[0] });
    }
  );
});

// === 2. Edytuj dane firmy ===
app.post('/edit-tenant', (req, res) => {
  const { company_id, name, description } = req.body;

  if (!company_id || !name || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const query = `
    UPDATE tenants
    SET name = ?, description = ?
    WHERE id = ?
  `;

  connection.query(query, [name, description, company_id], (err, result) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'Update failed' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({ message: 'Company updated successfully' });
  });
});

// === 3. Lista użytkowników firmy (z uprawnieniami) ===
app.get('/users-by-tenant/:company_id', (req, res) => {
  const { company_id } = req.params;

  const query = `
    SELECT 
      users.username,
      users.email,
      users.name,
      users.surname,
      permissions_dictionary.description AS permission,
      users.last_login,
      users.registration_date
    FROM users
    JOIN permissions_dictionary ON users.permissions = permissions_dictionary.permissions
    WHERE users.company_id = ?
  `;

  connection.query(query, [company_id], (err, results) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ users: results });
  });
});

app.get('/options-by-tenant/:tenant_id', (req, res) => {
  const { tenant_id } = req.params;

  const query = `
    SELECT label, hidden, type
    FROM options
    WHERE tenant_id = ?
  `;

  connection.query(query, [tenant_id], (err, results) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ options: results });
  });
});

app.listen(port, () => {
  console.log(`Tenant API listening on port ${port}`);
});
