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


__________________________________________________________________________


// src/context/AuthContext.tsx

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('authToken')
  );

  const login = (token: string) => {
    setToken(token);
    localStorage.setItem('authToken', token);
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};



// src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;


// src/components/Layout/Navbar.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar: React.FC = () => {
  const { token, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          Hashers Marketplace
        </Link>
        <ul className="navbar-nav">
          {token ? (
            <>
              <li className="nav-item">
                <Link to="/dashboard" className="nav-link">
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <button onClick={logout} className="nav-link">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/" className="nav-link">
                  Login
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-link">
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;


// src/components/Layout/Footer.tsx

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <p>© 2024 Hashers Marketplace. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;


// src/components/Auth/Login.tsx

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token);
        navigate('/dashboard');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="auth-form">
      <h2>Login</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;


// src/components/Auth/Register.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="auth-form">
      <h2>Register</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;



// src/components/ProtectedRoute.tsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

// src/components/Dashboard/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AddItem from '../Items/AddItem';
import ItemList from '../Items/ItemList';

interface Item {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  userId: string;
}

const Dashboard: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);  // Specify Item[] as the type
  const [error, setError] = useState('');
  const { token, logout } = useAuth();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/items', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          setItems(data);  // TypeScript now knows this is of type Item[]
        } else {
          setError(data.message || 'Failed to fetch items');
        }
      } catch (err) {
        setError('An error occurred. Please try again.');
      }
    };

    fetchItems();
  }, [token]);

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      {error && <p className="error">{error}</p>}
      <button onClick={logout}>Logout</button>
      <AddItem onAddItem={(item) => setItems((prevItems) => [...prevItems, item])} />
      <ItemList items={items} />
    </div>
  );
};

export default Dashboard;


// src/components/Items/AddItem.tsx

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface AddItemProps {
  onAddItem: (item: any) => void;
}

const AddItem: React.FC<AddItemProps> = ({ onAddItem }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | undefined>();
  const [image, setImage] = useState('');
  const [error, setError] = useState('');
  const { token } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!price) {
      setError('Price is required');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description, price, image }),
      });

      const data = await response.json();

      if (response.ok) {
        onAddItem(data);
        setName('');
        setDescription('');
        setPrice(undefined);
        setImage('');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="add-item">
      <h3>Add Item</h3>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Price:</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            required
          />
        </div>
        <div className="form-group">
          <label>Image URL:</label>
          <input
            type="text"
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
        </div>
        <button type="submit">Add Item</button>
      </form>
    </div>
  );
};

export default AddItem;


// src/components/Items/ItemList.tsx

import React from 'react';
import ItemCard from './ItemCard';

interface Item {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  userId: string;
}

interface ItemListProps {
  items: Item[];
}

const ItemList: React.FC<ItemListProps> = ({ items }) => {
  return (
    <div className="item-list">
      {items.map((item) => (
        <ItemCard key={item._id} item={item} />
      ))}
    </div>
  );
};

export default ItemList;


// src/components/Items/ItemCard.tsx

import React from 'react';

interface Item {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  userId: string;
}

interface ItemCardProps {
  item: Item;
}

const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  return (
    <div className="item-card">
      <img src={item.image} alt={item.name} />
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      <p>Price: ${item.price}</p>
    </div>
  );
};

export default ItemCard;



// src/components/Transactions/TransactionList.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

interface Transaction {
  _id: string;
  buyerId: string;
  sellerId: string;
  itemId: string;
  transactionType: string;
  status: string;
  createdAt: string;
}

const TransactionList: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/transactions', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          setTransactions(data);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('An error occurred. Please try again.');
      }
    };

    fetchTransactions();
  }, [token]);

  return (
    <div className="transaction-list">
      <h2>Transactions</h2>
      {error && <p className="error">{error}</p>}
      {transactions.map((transaction) => (
        <div key={transaction._id} className="transaction-item">
          <p>Transaction Type: {transaction.transactionType}</p>
          <p>Status: {transaction.status}</p>
          <p>Date: {new Date(transaction.createdAt).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
};

export default TransactionList;


// src/index.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import App from './App';

const rootElement = document.getElementById('root') as HTMLElement;
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


/* src/styles.css */

body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
}

.navbar {
  background-color: #333;
  padding: 10px;
}

.navbar .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-brand {
  color: #fff;
  text-decoration: none;
  font-size: 1.5em;
}

.navbar-nav {
  list-style: none;
  display: flex;
  margin: 0;
  padding: 0;
}

.navbar-nav .nav-item {
  margin-left: 20px;
}

.navbar-nav .nav-link {
  color: #fff;
  text-decoration: none;
  font-size: 1em;
}

.auth-form {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.auth-form h2 {
  margin-bottom: 20px;
}

.auth-form .form-group {
  margin-bottom: 15px;
}

.auth-form label {
  display: block;
  margin-bottom: 5px;
}

.auth-form input[type='text'],
.auth-form input[type='email'],
.auth-form input[type='password'],
.auth-form textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.auth-form button {
  background-color: #4caf50;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.auth-form button:hover {
  background-color: #45a049;
}

.dashboard {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
}

.item-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.item-card {
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 4px;
  text-align: center;
}

.item-card img {
  max-width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
}

.item-card h3 {
  margin: 10px 0;
}

.footer {
  background-color: #333;
  color: #fff;
  text-align: center;
  padding: 10px;
}

.error {
  color: red;
}
























