CREATE TABLE device_register (
    id INT PRIMARY KEY,
    name VARCHAR(255),
    modbus_register INT,
    bacnet_object INT,
    unit VARCHAR(255),
    data_type VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
