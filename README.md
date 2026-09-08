# FileFlow React JS Frontend

Standalone React JS + JSX source code matching the FileFlow website, including the Admin dashboard and Employee portal. No backend or database is included.

## Run on Windows

```powershell
cd FileFlow_ReactJS_JSX_Frontend
npm install
npm run dev
```

Open the local URL shown by Vite, normally `http://localhost:5173`.

## Demo logins

- Admin: `admin` / `Admin@123`
- Employee: `emp1` / `Employee@123`
- Project Admin: `projectadmin` / `Project@123`
- Quality Analyst: `qa` / `QA@123`
- Art Employee: `art1` / `Art@123`

## Source files

- `src/App.jsx` — all UI, role-based screens, dummy data and interactions
- `src/index.css` — complete responsive design
- `src/main.jsx` — React entry point

The working-model data is stored in browser `localStorage`. Use Reset Demo Data or clear browser storage to restore the original records.
