# BookNook – Release 1.0 Requirements

BookNook is an online bookstore. Customers browse and search a catalog, add books to a cart, apply discount codes, and check out. The web front end talks to a REST API.

This document is the requirements baseline used throughout the course labs.

---

## Project Context

| Item | Detail |
|------|--------|
| Release | 1.0 (first public launch) |
| Target date | 4 weeks from today, ahead of the holiday shopping season |
| Team | 1 Product Owner, 5 developers, 1 QA engineer (you) |
| Payments | Handled by a third-party payment provider (PayFast sandbox in non-prod) |
| Environments | dev, qa, prod |

---

## Functional Requirements

### F1 – Account Registration & Login
- F1.1 A visitor can register with an email address and password.
- F1.2 Passwords must be 8–64 characters and include at least one number and one letter.
- F1.3 Email addresses must be unique.
- F1.4 A registered user can log in and log out.
- F1.5 After 5 consecutive failed login attempts the account is locked for a period of time.
- F1.6 A user can reset a forgotten password via an emailed link.

### F2 – Catalog Browse & Search
- F2.1 Users (logged in or not) can browse books by category.
- F2.2 Users can search by title or author.
- F2.3 Results show 20 books per page with paging controls.
- F2.4 Search should be fast.

### F3 – Book Details
- F3.1 Each book has a details page showing title, author, price, description, cover image, and average rating.
- F3.2 Out-of-stock books show "Out of Stock" and cannot be added to the cart.

### F4 – Shopping Cart
- F4.1 Users can add books to the cart, change quantity, and remove books.
- F4.2 Quantity per book is 1–10.
- F4.3 The cart shows a running subtotal.
- F4.4 The cart is saved between sessions.

### F5 – Discount Codes
- F5.1 One discount code may be applied per order.
- F5.2 A code is either a percentage off (e.g., 15%) or a fixed amount off (e.g., $5).
- F5.3 Codes have an expiry date; expired codes are rejected with a message.
- F5.4 A discount cannot reduce the order total below $0.

### F6 – Checkout & Payment
- F6.1 Only logged-in users can check out.
- F6.2 The user enters a shipping address and pays by credit card through the payment provider.
- F6.3 Shipping is free on orders over $35; otherwise shipping is $4.99.
- F6.4 Sales tax is applied based on the shipping address.
- F6.5 On success, the user sees a confirmation page and receives a confirmation email.
- F6.6 If payment fails, no order is created and the user can retry.

### F7 – Order History
- F7.1 Logged-in users can see a list of their past orders with date, items, and total.
- F7.2 Users can view the details of a single order.

### F8 – Reviews & Ratings
- F8.1 Logged-in users can leave a 1–5 star rating and an optional text review.
- F8.2 Inappropriate content should be filtered.
- F8.3 A book's average rating updates when a new rating is added.

---

## Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NF1 | Performance | Pages load in under 3 seconds for 95% of requests with 200 concurrent users. |
| NF2 | Security | Passwords are stored hashed. All traffic uses HTTPS. Card data is never stored by BookNook. |
| NF3 | Accessibility | The site meets WCAG 2.1 Level AA. |
| NF4 | Compatibility | Supports the latest versions of Chrome, Firefox, Edge, and Safari, on desktop and mobile. |
| NF5 | Usability | The site should be user-friendly. |
| NF6 | Reliability | 99.5% uptime during business hours. |

---

## REST API (summary)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in, returns token |
| GET | `/api/books?q=&category=&page=` | Search / browse |
| GET | `/api/books/{id}` | Book details |
| GET / POST / PATCH / DELETE | `/api/cart` | View and modify cart |
| POST | `/api/cart/discount` | Apply discount code |
| POST | `/api/orders` | Place order (checkout) |
| GET | `/api/orders` / `/api/orders/{id}` | Order history / detail |
| POST | `/api/books/{id}/reviews` | Add rating/review |
