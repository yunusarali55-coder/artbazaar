CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'artist',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE listings (
  id SERIAL PRIMARY KEY,
  artist_id INT REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  listing_fee NUMERIC(10, 2) DEFAULT 250.00,
  commission_rate NUMERIC(4, 2) DEFAULT 0.10,
  status VARCHAR(50) DEFAULT 'pending_payment',
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
