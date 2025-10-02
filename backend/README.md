# Facility Management API

Backend API server for the Facility Management System that connects to MongoDB.

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
The `.env` file is already configured with your MongoDB connection:
```
MONGODB_URI=mongodb+srv://emil_user:db2424@cluster0.tveleqd.mongodb.net/meterdb
```

### 3. Initialize Database
First, run the MongoDB setup script to create collections and sample data:
- Open the `connect-to-meterdb.mongodb.js` file in Kiro
- Execute the script to create all necessary collections

### 4. Start the Server
```bash
# Development mode with auto-restart
npm run dev

# Or production mode
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/verify` - Verify current token
- `POST /api/auth/logout` - User logout

### Buildings
- `GET /api/buildings` - Get all buildings (with filtering/pagination)
- `GET /api/buildings/:id` - Get building by ID
- `POST /api/buildings` - Create new building
- `PUT /api/buildings/:id` - Update building
- `DELETE /api/buildings/:id` - Delete building
- `PATCH /api/buildings/bulk-status` - Bulk update building status

### Equipment
- `GET /api/equipment` - Get all equipment
- `POST /api/equipment` - Create new equipment
- `PUT /api/equipment/:id` - Update equipment
- `DELETE /api/equipment/:id` - Delete equipment

### Contacts
- `GET /api/contacts` - Get all contacts
- `POST /api/contacts` - Create new contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

### Meters
- `GET /api/meters` - Get all meters
- `POST /api/meters` - Create new meter
- `PUT /api/meters/:id` - Update meter
- `DELETE /api/meters/:id` - Delete meter

## Default Admin User

After running the database setup script, you can login with:
- **Email:** admin@example.com
- **Password:** admin123

## Database Collections

The API connects to the following collections in your `meterdb` database:
- `users` - User accounts and authentication
- `buildings` - Building information and management
- `equipment` - Equipment inventory and maintenance
- `contacts` - Customer and vendor contacts
- `meters` - Meter configurations and readings
- `emailtemplates` - Email template library
- `companysettings` - System configuration

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Input validation
- SQL injection prevention
- XSS protection