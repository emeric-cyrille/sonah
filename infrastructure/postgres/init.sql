-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create database
CREATE DATABASE sonah;

-- Connect to sonah database
\c sonah;

-- Enable pgvector in sonah database
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a test table to verify pgvector is working
CREATE TABLE IF NOT EXISTS test_embeddings (
    id SERIAL PRIMARY KEY,
    content TEXT,
    embedding vector(1536)
);

-- Success message
SELECT 'PostgreSQL with pgvector initialized successfully!' AS message;
