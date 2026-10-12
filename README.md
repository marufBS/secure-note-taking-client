# NoteBunker — Frontend

A responsive note-taking application built with React and TypeScript. It provides an interface for managing personal notes, authenticating users, and accessing administrative features.

## Features

- **Authentication:** User registration and login.
- **Notes management:** Create, view, update, and delete personal notes.
- **Dashboard:** Browse and manage notes with pagination.
- **Admin user management:** Manage user accounts through the admin interface.
- **Admin notes overview:** View notes across users.
- **Protected access:** Connects to authenticated backend endpoints using JWT.
- **Responsive UI:** Built with Tailwind CSS and shadcn/ui components.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- Fetch API for backend communication

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

Clone the repository and enter the frontend project directory:

```bash
git clone https://github.com/marufBS/secure-note-taking-client.git
cd <frontend-project-directory>
npm install
```

### Environment Variables

Create a `.env` file in the frontend project root:

```env
VITE_API_URL=https://secure-note-taking-api.onrender.com/api
```


### Run the Development Server

```bash
npm run dev
```

Vite will display the local development URL in the terminal.

### Build for Production

```bash
npm run build
```



## Project Structure

```text
src/
├── assets/
├── components/
│   └── ui/
├── lib/
│   └── api.ts
├── pages/
│   ├── AdminPage.tsx
│   ├── AdminUsersPage.tsx
│   ├── DashboardPage.tsx
│   ├── LoginPage.tsx
│   ├── ProfilePage.tsx
│   ├── RegisterPage.tsx
│   └── ...
├── App.tsx
└── main.tsx
```

