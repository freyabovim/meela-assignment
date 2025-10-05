# Client Onboarding Form

by Freya Bovim

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Rust](https://rustup.rs/) (latest stable)

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/freyabovim/meela-assignment.git
   cd meela-assignment
   ```

2. **Backend Setup**
   ```bash
   cd backend
   
   # Install sqlx-cli for database migrations
   cargo install sqlx-cli
   
   # Create environment file
   echo "DATABASE_URL=sqlite:data.db" > .env
   
   # Create and migrate database
   sqlx database create
   sqlx migrate run
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

## Running the Application

1. **Start the backend** (from `backend/` directory):
   ```bash
   cargo run
   ```
   Backend will run on `http://localhost:3000`

2. **Start the frontend** (from `frontend/` directory):
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`
