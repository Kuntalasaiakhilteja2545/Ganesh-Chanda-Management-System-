# 🕉️ Ganesh Chanda Management System (GMS)

A full-stack, bilingual (English / తెలుగు) financial & donation management application designed for Ganesh Youth Committees and Pandal associations.

---

## 🌟 Key Features

* **Authentication & Authorization**: Role-based access hierarchy: `ADMIN` > `TREASURER` > `COLLECTOR`.
* **Donations & Sequential Receipts**: Atomic donation records with automatic receipt numbering (e.g., `GCH-2026-0001`).
* **Bilingual Support**: Instant toggle between English and Telugu throughout the entire user interface.
* **Instant Digital & PDF Receipts**: ReportLab-powered A5 printable PDF receipts with Telugu support, borders, and amount in words.
* **Expense & Category Management**: Pre-seeded with 15 cultural and pandal expense categories (Idol, Lighting, Sound, Flowers, Food, etc.).
* **Live Dashboard & Financial Analytics**: Real-time totals, available treasury balance, payment method breakdowns, and category distribution progress bars.
* **Budget Planning**: Planned vs Actual expense tracking with projected balance forecast and budget deficit warning banners.
* **Reports & Excel Exports**: Daily audits, monthly aggregations, year-over-year festival comparison, and 1-click Excel `.xlsx` exports.
* **Public Transparency Portal**: Open read-only live metrics page for devotees without requiring login credentials.
* **Audit Trail**: Immutable logging of all financial alterations with timestamps, users, and IP addresses.
* **Mobile Ready**: React Native (Expo) mobile collector application for recording donations on-the-go.

---

## 🛠️ Architecture & Tech Stack

* **Backend**: Python 3.14 + Django 6.1 + Django REST Framework + SimpleJWT + PostgreSQL 17
* **PDF & Export Engines**: ReportLab + openpyxl
* **Web Frontend**: React 19 + Vite 8 + Tailwind CSS + Lucide Icons
* **Mobile App**: React Native (Expo) + React Navigation
* **API Documentation**: OpenAPI 3.0 / Swagger UI at `/api/docs/`

---

## 🚀 Quick Start Guide

### 1. Backend Setup

```powershell
# Activate Virtual Environment
d:\GMS\venv\Scripts\Activate.ps1

# Navigate to backend
cd d:\GMS\backend

# Run Migrations
python manage.py migrate

# Start Django Development Server
python manage.py runserver 0.0.0.0:8000
```
Backend API will be running at: `http://localhost:8000/api/`
Swagger API Documentation: `http://localhost:8000/api/docs/`

---

### 2. React Web Frontend Setup

```powershell
# Navigate to frontend
cd d:\GMS\frontend

# Install dependencies (already installed)
npm install

# Start Vite Development Server
npm run dev
```
Web App will be accessible at: `http://localhost:3000`
Public Devotee Transparency Portal: `http://localhost:3000/public`

---

### 3. Mobile App Setup (React Native / Expo)

```powershell
# Navigate to mobile
cd d:\GMS\mobile

# Install dependencies (already prepared)
npm install

# Start Expo Dev Server
npx expo start
```

---

## 🔑 Default User Credentials

| Role | Username | Password | Permissions |
|---|---|---|---|
| **Administrator** | `admin` | `admin123` | Full access, Festivals, User Management, Audit Logs |
| **Treasurer** | `treasurer` | `treasurer123` | Expenses, Budgets, Financial Reports, Excel Exports |
| **Collector** | `collector` | `collector123` | Record Donations, View Donors, Issue Receipts |

---

## 🧪 Running Automated Tests

```powershell
cd d:\GMS\backend
d:\GMS\venv\Scripts\python.exe manage.py test accounts.test_suite
```
