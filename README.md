# Software Requirements Specification (SRS) for RestoFlow

**Version:** 2.1
**Date:** 2025-12-31

---

## 1. Introduction

### 1.1 Purpose
The purpose of this document is to define the software requirements for **RestoFlow**, a comprehensive web-based Point of Sale (POS) ecosystem. This document covers the functional and non-functional requirements, system interface, and design constraints for the main POS, Checkout, Admin Panel, and Kitchen Display System (KDS).

### 1.2 Scope
RestoFlow is a multi-module single-page application suite designed to streamline restaurant operations. The system now includes:
*   **POS Terminal**: For browsing the menu, adding items to the cart, and managing orders.
*   **Checkout System**: A dedicated page for reviewing orders, calculating taxes, and finalizing transactions with multiple payment methods (Cash, Card, UPI, Split).
*   **Admin Panel**: A centralized dashboard for menu management (CRUD operations) and viewing order history, backed by **Supabase**.
*   **Kitchen Display System (KDS)**: A live feed for kitchen staff to view and manage incoming orders in real-time.

### 1.3 Definitions, Acronyms, and Abbreviations
*   **POS**: Point of Sale.
*   **KDS**: Kitchen Display System.
*   **SRS**: Software Requirements Specification.
*   **SPA**: Single Page Application.
*   **CRUD**: Create, Read, Update, Delete.
*   **Supabase**: An open-source Firebase alternative used for database and real-time features.

### 1.4 Overview
The rest of this document describes the specific requirements for the RestoFlow application suite, detailing the user interface and capabilities of each module.

---

## 2. Overall Description

### 2.1 Product Perspective
RestoFlow is a suite of web based interfaces running in a standard web browser. It uses `localStorage` for temporary state persistence (Cart) and **Supabase (PostgreSQL)** for persistent data storage (Menu, Orders) and real-time synchronization between modules.

### 2.2 Product Functions
The major functions of the system include:
*   **POS & Order Entry**: Visual menu, category filtering, cart management, and search.
*   **Checkout & Payment**: Detailed order summary, tax calculation, and flexible payment options:
    *   **Cash**: With change calculation helper.
    *   **Online**: Integrated with **Razorpay** for UPI/Card payments.
    *   **Split**: Ability to split payments between Cash and Online.
    *   **Receipts**: Automatic receipt printing upon successful order.
*   **Admin Management**: Secure login, adding/editing/removing menu items (synced to DB), and viewing comprehensive order history.
*   **Kitchen Operations**: Real-time order dashboard that updates instantly when orders are placed, with sound notifications.

### 2.3 User Characteristics
*   **Cashiers/Waitstaff**: Quick order entry and payment processing.
*   **Kitchen Staff**: Viewing and clearing completed orders.
*   **Managers**: Updating menu prices and items, tracking sales.

---

## 3. Specific Requirements

### 3.1 Functional Requirements

#### 3.1.1 POS Module (`index.html`)
*   **FR-01**: Display responsive product grid with filtering by category.
*   **FR-02**: "Add to Cart" functionality with a slide-out drawer summary.
*   **FR-03**: Real-time search for quick item lookup.
*   **FR-04**: "Checkout" button navigating to the dedicated checkout page.

#### 3.1.2 Checkout Module (`checkout.html`)
*   **FR-05**: Persistent cart data loaded from `localStorage`.
*   **FR-06**: Display itemized bill including Subtotal and Tax (5%).
*   **FR-07**: Supports multiple payment flows: **Cash** (with denomination buttons), **Card/UPI** (Razorpay integration), and **Split Payment**.
*   **FR-08**: Successful payment saves order to Supabase and triggers receipt printing.

#### 3.1.3 Admin Module (`admin.html`)
*   **FR-09**: Simple overlay login protection.
*   **FR-10**: **Menu Management**: add/edit/delete items directly impacting the live menu (Supabase).
*   **FR-11**: **Order History**: View past orders fetched from the database, including split payment details.
*   **FR-12**: Dashboard navigation between Menu and Orders.

#### 3.1.4 Kitchen Module (`kitchen.html`)
*   **FR-13**: Simple overlay login protection.
*   **FR-14**: **Real-time Feed**: Orders appear instantly via Supabase Realtime subscriptions.
*   **FR-15**: Audio notifications for new incoming orders.
*   **FR-16**: Ability to mark orders as "Complete" to remove them from the active board.

### 3.2 Interface Requirements
*   **Design System**: Unified typography (Inter/Poppins), dark/light mode aesthetics, and consistent accents (`#378e7d`, `#4ade80`).
*   **Responsiveness**: Optimized for tablet and desktop viewports.

---

## 4. Appendix: Getting Started

### 4.1 Prerequisites
*   Node.js (for `live-server`).
*   Internet connection (for Supabase and Razorpay scripts).

### 4.2 Installation and Execution
1.  Navigate to the project directory:
    ```bash
    cd <project-directory>
    ```
2.  Start the local development server:
    ```bash
    npx live-server .
    ```
3.  Access the modules:
    *   **POS**: `http://127.0.0.1:8080/index.html`
    *   **Admin**: `http://127.0.0.1:8080/admin.html` (Pass: `admin123`)
    *   **Kitchen**: `http://127.0.0.1:8080/kitchen.html`

### 4.3 Configuration (API Keys)
Before running the application, you must replace the placeholder API keys with your own **Supabase** and **Razorpay** credentials.

Open the following files and replace the values:

1.  **`scripts/script.js`**: `YOUR_SUPABASE_URL`, `YOUR_SUPABASE_KEY`
2.  **`scripts/checkout.js`**: `YOUR_SUPABASE_URL`, `YOUR_SUPABASE_KEY`, `YOUR_RAZORPAY_KEY`
3.  **`scripts/kitchen.js`**: `YOUR_SUPABASE_URL`, `YOUR_SUPABASE_KEY`
4.  **`scripts/admin.js`**: `YOUR_SUPABASE_URL`, `YOUR_SUPABASE_KEY`

> **Note**: This setup ensures your API keys remain secure and are not hardcoded in the public repository.

---

## 5. Code Structure & Walkthrough

### 5.1 Project Structure
The project is split into functional modules with assets organized in subdirectories:

| Module | HTML | CSS | JS | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **POS** | `index.html` | `styles/style.css` | `scripts/script.js` | Main entry point, catalog, cart. |
| **Checkout** | `checkout.html` | `styles/checkout.css` | `scripts/checkout.js` | Payments (Razorpay/Split), Receipts. |
| **Admin** | `admin.html` | `styles/admin.css` | `scripts/admin.js` | Back-office (Supabase CRUD). |
| **Kitchen** | `kitchen.html` | *(Inline)* | `scripts/kitchen.js` | KDS (Real-time). |

### 5.2 Key Components
*   **Assets**: `img/` for food images and `icons/` for UI elements.
*   **State Management**:
    *   **Client-Side**: `localStorage` passes Cart data from POS to Checkout.
    *   **Backend (Supabase)**: Stores `products` (Menu) and `orders` (Transactions).
    *   **Real-time**: Kitchen view subscribes to database changes for instant updates.
