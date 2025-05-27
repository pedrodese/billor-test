-- Create drivers table
CREATE TABLE drivers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create loads table (removendo a coluna 'price' conforme seu exemplo)
CREATE TABLE loads (
    id SERIAL PRIMARY KEY,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    pickup_time VARCHAR(50),
    delivery_time VARCHAR(50),
    route VARCHAR(255),
    loaded_weight VARCHAR(50),
    equipment VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create summaries table
CREATE TABLE summaries (
    id SERIAL PRIMARY KEY,
    load_id INT REFERENCES loads(id) ON DELETE CASCADE,
    summary_text TEXT NOT NULL,
    insights JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Add index for common queries on the loads table
CREATE INDEX idx_loads_origin_destination ON loads (origin, destination);
