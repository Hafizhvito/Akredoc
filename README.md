
# AkreDoc

A web-based application designed to manage accreditation documents using the PPEPP framework. This project consists of two parts:

- **akredoc-backend**: The backend of the application, built with Laravel 10.
- **akredoc-frontend**: The frontend of the application, built with React.

---

## Prerequisites

Before running the project, ensure you have the following software installed:

- **Node.js** (v20.18.0 or higher)
- **Composer** (for PHP dependencies)
- **MySQL** (v8.2.25 or higher)
- **Laravel** (v10)
- **PHP** (v8.2 or higher)
- **Git**

---

## Backend Setup (akredoc-backend)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Hafizhvito/Akredoc
   ```

2. **Navigate to the backend directory:**
   ```bash
   cd akredoc-backend
   ```

3. **Install PHP dependencies using Composer:**
   ```bash
   composer install
   ```

4. **Set up your environment file:**
   - Copy the `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Update the `.env` file with your database and other configurations (like mail settings).

5. **Generate the application key:**
   ```bash
   php artisan key:generate
   ```

6. **Run migrations to set up the database:**
   ```bash
   php artisan migrate
   ```

7. **Seed the database (optional):**
   ```bash
   php artisan db:seed
   ```

8. **Run the backend server:**
   ```bash
   php artisan serve
   ```

   The backend should now be running on `http://localhost:8000`.

---

## Frontend Setup (akredoc-frontend)

1. **Navigate to the frontend directory:**
   ```bash
   cd ../akredoc-frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Set up your environment file (if applicable):**
   - If you need any environment variables (like API base URL), create a `.env` file and configure it.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

   The frontend should now be running on `http://localhost:5173` (or another port, depending on your setup).

---

## Directory Structure

- **akredoc-backend/**: Contains the backend code (Laravel 10 application).
  - **app/**: Application logic, including controllers, models, and services.
  - **database/**: Database migrations and seeders.
  - **resources/**: Views and email templates.
  - **routes/**: API and web routes.
  - **storage/**: Logs and file storage.

- **akredoc-frontend/**: Contains the frontend code (React application).
  - **public/**: Public assets like images and the main `index.html`.
  - **src/**: React components, pages, and app logic.
  - **tailwind.config.js**: Tailwind CSS configuration.
  - **vite.config.js**: Vite configuration for building and serving the frontend.

---

## License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.
