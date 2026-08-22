# Hostel Mess Feedback and Menu Portal

## Problem Statement

**Problem Statement ID:** RWW-4  
**Title:** Hostel Mess Feedback and Menu Portal  
**Category:** Software  
**Theme:** Campus Utility

Hostel students often do not have a clear way to check the daily mess menu or share structured feedback about their meals. Informal feedback makes it difficult for hostel management to identify recurring complaints, measure satisfaction, and improve mess services.

## Proposed Solution

The Hostel Mess Feedback and Menu Portal is a web application that gives students a single place to view the weekly mess menu and submit feedback about their meals. Students can rate breakfast, lunch, snacks, and dinner on a 1-5 star scale and add a short comment.

Mess administrators can manage menu items, view ratings and feedback, calculate average meal ratings, and identify low-rated meals and common complaints.

## Architecture

The application uses a client-server architecture:

1. **Presentation layer:** React components and CSS provide the login, student, and admin interfaces.
2. **Application layer:** React pages, React Router, and the authentication context manage navigation, user sessions, role-based access, and user actions.
3. **Backend services layer:** Supabase Auth handles authentication and Supabase provides the API used by the frontend.
4. **Data layer:** Supabase PostgreSQL stores profiles, menu items, and feedback. Row Level Security policies control access for students and administrators.

```text
Student/Admin browser
	|
	v
React + React Router frontend
	|
	v
Supabase Auth and API
	|
	v
PostgreSQL database with Row Level Security
```

## Technology Stack

- **Frontend:** React.js
- **Build tool:** Vite
- **Routing:** React Router
- **Backend and database:** Supabase and PostgreSQL
- **Authentication:** Supabase Auth
- **Data access:** Supabase JavaScript client
- **Styling:** CSS
- **Icons:** Lucide React
- **Code quality:** Oxlint

## How the System Works

### Student Workflow

`Login -> View Menu -> Select Meal -> Give Rating -> Submit Feedback`

### Admin Workflow

`Login -> Manage Menu -> View Ratings -> View Feedback -> Identify Issues`

## Main Features

### Student Features

- Student registration and login
- Weekly mess menu
- Today's menu
- 1-5 star meal rating
- Short feedback comment
- View submitted feedback

### Admin Features

- Admin login
- Add, edit, and delete menu items
- View average ratings
- View all student feedback
- Identify low-rated meals and common complaints

## Expected Impact

The portal replaces informal feedback methods with a structured digital platform. Students can easily express their opinions, while hostel management receives organized information that can be used to improve food quality and mess services.

## Team Members

- Kanishkaa M
- Jeevalakshmi G
- Guruprasanth S

## Local Setup

1. Install Node.js.
2. Install project dependencies:

   ```powershell
   npm install
   ```

3. Create a `.env` file in the project root:

   ```env
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Run the SQL in `schema.sql` in the Supabase SQL Editor.
5. Start the development server:

   ```powershell
   npm run dev
   ```
