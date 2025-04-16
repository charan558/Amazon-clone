require('dotenv').config(); // Load environment variables
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); // Secure password storage
const jwt = require('jsonwebtoken'); // Authentication

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

// MySQL Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '12345',
    database: process.env.DB_NAME || 'amazon_clone'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to MySQL database');
    }
});

// ✅ User Registration (with Password Hashing)
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';

    db.query(query, [username, email, hashedPassword], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error registering user' });
        }
        res.json({ message: 'User registered successfully' });
    });
});

// ✅ User Login (with JWT Authentication)
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM users WHERE email = ?';

    db.query(query, [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error logging in' });
        }
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user.id }, 'secret_key', { expiresIn: '1h' });
        res.json({ message: 'Login successful', token });
    });
});

// ✅ Fetch Products
app.get('/products', (req, res) => {
    const query = 'SELECT * FROM products';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Error fetching products' });
        res.json(results);
    });
});

// ✅ Middleware: Verify JWT Token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'Token is required' });

    jwt.verify(token.split(' ')[1], 'secret_key', (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' });
        req.userId = decoded.userId;
        next();
    });
};

// ✅ Add to Cart (Requires Login)
app.post('/cart', verifyToken, (req, res) => {
    const { productId, quantity } = req.body;
    const query = 'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)';
    
    db.query(query, [req.userId, productId, quantity], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error adding to cart' });
        res.json({ message: 'Added to cart' });
    });
});

// ✅ Fetch Cart Items (Requires Login)
app.get('/cart', verifyToken, (req, res) => {
    const query = `
        SELECT cart.id, products.name, products.price, cart.quantity 
        FROM cart 
        JOIN products ON cart.product_id = products.id 
        WHERE cart.user_id = ?`;
    
    db.query(query, [req.userId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error fetching cart' });
        res.json(results);
    });
});

// ✅ Remove Item from Cart
app.delete('/cart/:cartId', verifyToken, (req, res) => {
    const { cartId } = req.params;
    const query = 'DELETE FROM cart WHERE id = ? AND user_id = ?';

    db.query(query, [cartId, req.userId], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error removing item from cart' });
        res.json({ message: 'Item removed from cart' });
    });
});

// ✅ Clear User Cart
app.delete('/cart/clear', verifyToken, (req, res) => {
    const query = 'DELETE FROM cart WHERE user_id = ?';
    db.query(query, [req.userId], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error clearing cart' });
        res.json({ message: 'Cart cleared successfully' });
    });
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

