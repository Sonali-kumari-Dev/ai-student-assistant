# AI Student Assistant

A full-stack **MERN-based AI Student Assistant** designed to help students manage their academic activities from a single platform.

The application provides features for managing subjects, attendance, assignments, notes, exams, study planning, academic progress, and an integrated AI assistant.

## 🚀 Features

* 🔐 User Registration & Login
* 📊 Student Dashboard
* 📚 Subject & Course Management
* 📅 Assignment Management
* 📝 Notes Management
* 🗓️ Study Planner
* 📖 Exam Management
* 📈 Academic Progress Tracking
* ✅ Attendance Management
* 🤖 AI Student Assistant
* 💬 AI Chat History & Clear History
* 👨‍🏫 Teacher/Student workflow
* 🌙 Light & Dark Theme
* 📱 Responsive User Interface

## 🛠️ Tech Stack

### Frontend

* React.js
* Vite
* JavaScript
* HTML5
* CSS3

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose

### Authentication & Security

* JWT Authentication
* bcryptjs
* Environment Variables

### AI

* AI-powered student assistance and academic support

## 📂 Project Structure

```text
AI-Student-Assistant/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── ...
│
├── server/
│   ├── routes/
│   ├── models/
│   ├── controllers/
│   └── ...
│
├── public/
├── package.json
├── vite.config.js
└── README.md
```

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Sonali-kumari-Dev/ai-student-assistant.git
```

### 2. Open the Project

```bash
cd ai-student-assistant
```

### 3. Install Dependencies

```bash
npm install
```

If the backend has a separate package configuration:

```bash
cd server
npm install
```

### 4. Configure Environment Variables

Create a `.env` file and add the required configuration such as:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Add any required AI/API key according to the AI service used by the project.

### 5. Run the Application

Start the development server using:

```bash
npm run dev
```

Start the backend separately if required:

```bash
cd server
npm run dev
```

The application will then be available on the local development server shown in the terminal.

## 🔄 Application Workflow

```text
User Registration/Login
        ↓
Student Dashboard
        ↓
Academic Modules
 ┌──────┼───────┬─────────┐
 ↓      ↓       ↓         ↓
Subjects Attendance Assignments Notes
 ↓      ↓       ↓         ↓
Planner → Exams → Progress Tracking
        ↓
   AI Student Assistant
```

## 🎯 Project Objective

The objective of this project is to develop a centralized academic management platform that helps students organize their academic activities and receive AI-based assistance.

Instead of using separate applications for attendance, assignments, notes, exams, planning, and academic tracking, students can access these features through a single platform.

## 👥 User Roles

### Student

Students can:

* View academic information
* Track attendance
* Manage assignments
* Create and manage notes
* Plan study activities
* Track exams
* Monitor academic progress
* Interact with the AI assistant

### Teacher

Teachers can manage and publish relevant academic content so that it becomes available to students through the platform.

## 🔒 Security

The application uses:

* JWT-based authentication
* Password hashing with bcryptjs
* Protected routes
* Environment variables for sensitive configuration
* MongoDB for persistent data storage

## 📌 Future Enhancements

* Push notifications for assignments and exams
* Advanced AI study recommendations
* Automated timetable generation
* Attendance prediction
* Personalized learning analytics
* Email notifications
* Mobile application
* Advanced teacher and administrator dashboards

## 👩‍💻 Developer

**Sonali Kumari**

Third Year Information Technology
VSIT, Mumbai

GitHub: **Sonali-kumari-Dev**

## 📄 License

This project was developed as an academic project for educational and demonstration purposes.
