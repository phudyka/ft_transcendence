-- Initialisation de la base de données pour le projet Pong

-- Suppression des tables existantes si elles existent
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS friends CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;
DROP TABLE IF EXISTS tournament_participants CASCADE;
DROP TABLE IF EXISTS private_messages CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;

-- Table des utilisateurs
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(50) UNIQUE NOT NULL,
    avatar_url VARCHAR(255) DEFAULT 'default_avatar.png',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_online BOOLEAN DEFAULT FALSE,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0
);

-- Table des relations d'amitié
CREATE TABLE friends (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    friend_id INTEGER REFERENCES users(id),
    status VARCHAR(20) CHECK (status IN ('pending', 'accepted')),
    UNIQUE (user_id, friend_id)
);

-- Table des matchs
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER,
    player1_id INTEGER REFERENCES users(id),
    player2_id INTEGER REFERENCES users(id),
    winner_id INTEGER REFERENCES users(id),
    score VARCHAR(20),
    played_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des tournois
CREATE TABLE tournaments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
);

-- Table des participants aux tournois
CREATE TABLE tournament_participants (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id),
    user_id INTEGER REFERENCES users(id),
    UNIQUE (tournament_id, user_id)
);

-- Table des messages privés
CREATE TABLE private_messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);

-- Table des paramètres utilisateur
CREATE TABLE user_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    notification_preferences JSONB,
    language_preference VARCHAR(10) DEFAULT 'en',
    theme_preference VARCHAR(20) DEFAULT 'light'
);

-- Création des index pour améliorer les performances
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);
CREATE INDEX idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX idx_matches_player1_id ON matches(player1_id);
CREATE INDEX idx_matches_player2_id ON matches(player2_id);
CREATE INDEX idx_private_messages_sender_id ON private_messages(sender_id);
CREATE INDEX idx_private_messages_receiver_id ON private_messages(receiver_id);

-- Insertion de quelques données de test
INSERT INTO users (username, email, password_hash, display_name) VALUES
('fab', 'fab@example.com', 'fab', 'fab'),
('player2', 'player2@example.com', 'hashed_password', 'Player Two');

INSERT INTO friends (user_id, friend_id, status) VALUES
(1, 2, 'accepted');

INSERT INTO tournaments (name, start_date, end_date) VALUES
('First Tournament', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 day');

INSERT INTO tournament_participants (tournament_id, user_id) VALUES
(1, 1), (1, 2);

INSERT INTO matches (tournament_id, player1_id, player2_id, winner_id, score) VALUES
(1, 1, 2, 1, '3-2');

INSERT INTO private_messages (sender_id, receiver_id, message) VALUES
(1, 2, 'Good game!');

INSERT INTO user_settings (user_id, notification_preferences) VALUES
(1, '{"email": true, "push": false}'),
(2, '{"email": false, "push": true}');