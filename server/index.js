import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import { register } from "./controllers/auth.js";
import { createPost } from "./controllers/posts.js";
import { verifyToken } from "./middleware/auth.js";
import User from "./models/User.js";
import Post from "./models/Post.js";
import { users, posts } from "./data/index.js";

/* CONFIGURATIONS */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

/* FILE STORAGE */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/assets");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

/* ROUTES WITH FILES */
app.post("/auth/register", upload.single("picture"), register);
app.post("/posts", verifyToken, upload.single("picture"), createPost);

/* ROUTES */
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);

/* MONGOOSE SETUP */
const PORT = process.env.PORT || 6001;
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Server Port: ${PORT}`));

    /* ADD DATA ONE TIME */
    // User.insertMany(users);
    // Post.insertMany(posts);
  })
  .catch((error) => console.log(`${error} did not connect`));



_______________________________________________________________

<!-- public/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hashers Marketplace</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div id="root"></div>
</body>
</html>


// src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import { AuthProvider } from './context/AuthContext';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;

// src/index.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


// src/components/common/Navbar.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          Hashers Marketplace
        </Link>
        <ul className="navbar-nav">
          {isAuthenticated ? (
            <>
              <li className="nav-item">
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
              </li>
              <li className="nav-item">
                <button className="nav-link logout-btn" onClick={logout}>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/login" className="nav-link">Login</Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-link">Register</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;


// src/components/common/Footer.tsx

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <p>&copy; 2024 Hashers Marketplace. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;



// src/components/Auth/Login.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="auth-form">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        {error && <div className="error">{error}</div>}
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="auth-btn">Login</button>
      </form>
    </div>
  );
};

export default Login;



// src/components/Auth/Register.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await register(username, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError('Registration failed');
    }
  };

  return (
    <div className="auth-form">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        {error && <div className="error">{error}</div>}
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="auth-btn">Register</button>
      </form>
    </div>
  );
};

export default Register;


// src/components/Dashboard/Dashboard.tsx

import React from 'react';
import ItemList from '../Items/ItemList';

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <h1>Welcome to your Dashboard</h1>
      <ItemList />
    </div>
  );
};

export default Dashboard;



// src/components/Items/ItemList.tsx

import React, { useEffect, useState } from 'react';
import { fetchItems } from '../../services/api';
import ItemCard from './ItemCard';
import AddItem from './AddItem';

const ItemList: React.FC = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const loadItems = async () => {
      const fetchedItems = await fetchItems();
      setItems(fetchedItems);
    };

    loadItems();
  }, []);

  return (
    <div className="item-list">
      <AddItem />
      <div className="item-grid">
        {items.map((item: any) => (
          <ItemCard key={item._id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default ItemList;


// src/components/Items/ItemCard.tsx

import React from 'react';

interface ItemProps {
  item: {
    _id: string;
    name: string;
    description: string;
    price: number;
    image: string;
  };
}

const ItemCard: React.FC<ItemProps> = ({ item }) => {
  return (
    <div className="item-card">
      <img src={item.image} alt={item.name} className="item-image" />
      <div className="item-details">
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        <p className="item-price">${item.price.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default ItemCard;



// src/components/Items/AddItem.tsx

import React, { useState } from 'react';
import { addItem } from '../../services/api';

const AddItem: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addItem({ name, description, price: parseFloat(price), image });
    setName('');
    setDescription('');
    setPrice('');
    setImage('');
    window.location.reload(); // Reload to show the new item
  };

  return (
    <div className="add-item">
      <h2>Add New Item</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Item Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="price">Price:</label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="image">Image URL:</label>
          <input
            type="text"
            id="image"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="add-item-btn">Add Item</button>
      </form>
    </div>
  );
};

export default AddItem;


// src/components/Transactions/TransactionList.tsx

import React, { useEffect, useState } from 'react';
import { fetchTransactions } from '../../services/api';

const TransactionList: React.FC = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const loadTransactions = async () => {
      const fetchedTransactions = await fetchTransactions();
      setTransactions(fetchedTransactions);
    };

    loadTransactions();
  }, []);

  return (
    <div className="transaction-list">
      <h2>Your Transactions</h2>
      <ul>
        {transactions.map((transaction: any) => (
          <li key={transaction._id}>
            {transaction.transactionType} - {transaction.itemName} - ${transaction.amount}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TransactionList;


// src/services/api.ts

import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const fetchItems = async () => {
  const response = await axios.get(`${API_URL}/items`);
  return response.data;
};

export const addItem = async (item: any) => {
  await axios.post(`${API_URL}/items`, item);
};

export const fetchTransactions = async () => {
  const response = await axios.get(`${API_URL}/transactions`);
  return response.data;
};

export const login = async (email: string, password: string) => {
  const response = await axios.post(`${API_URL}/auth/login`, { email, password });
  localStorage.setItem('token', response.data.token);
};

export const register = async (username: string, email: string, password: string) => {
  const response = await axios.post(`${API_URL}/auth/register`, { username, email, password });
  localStorage.setItem('token', response.data.token);
};

export const logout = () => {
  localStorage.removeItem('token');
};


// src/context/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin, logout as apiLogout, register as apiRegister } from '../services/api';

interface AuthContextProps {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps>({
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const login = async (email: string, password: string) => {
    await apiLogin(email, password);
    setIsAuthenticated(true);
  };

  const register = async (username: string, email: string, password: string) => {
    await apiRegister(username, email, password);
    setIsAuthenticated(true);
  };

  const logout = () => {
    apiLogout();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};




// src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import './styles.css';

const ProtectedRoute = ({ element: Element, ...rest }: any) => {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <Element {...rest} /> : <Login />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute element={Dashboard} />} />
        </Routes>
        <Footer />
      </Router>
    </AuthProvider>
  );
};

export default App;



/* src/styles.css */

body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
}

.auth-form,
.add-item,
.item-card,
.transaction-list {
  margin: 20px;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.auth-form h2,
.add-item h2,
.transaction-list h2 {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.auth-btn,
.add-item-btn {
  background-color: #4CAF50;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.auth-btn:hover,
.add-item-btn:hover {
  background-color: #45a049;
}

.item-card {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.item-card img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 5px;
}

.item-card .item-details {
  text-align: center;
}

.item-price {
  font-weight: bold;
  color: #2b8a3e;
}

.item-list .item-grid {
  display: flex;
  flex-wrap: wrap;
}

.item-grid .item-card {
  margin: 10px;
  flex: 1 0 21%; /* Four items per row */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.error {
  color: red;
  margin-bottom: 15px;
}

.transaction-list ul {
  list-style-type: none;
  padding: 0;
}

.transaction-list li {
  margin-bottom: 10px;
}



// src/index.tsx

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

















