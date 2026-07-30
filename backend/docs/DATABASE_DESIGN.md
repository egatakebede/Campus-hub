# Campus Hub Database Design Document

**Project:** Campus Hub
**Module:** Database Design
**Database:** PostgreSQL
**ORM:** Prisma
**Prepared By:** Database Engineer
**Version:** 1.1
**Last Updated:** July 2026

---

# 1. Purpose

This document defines the database architecture for the Campus Hub project. It serves as the foundation for backend development by documenting the data model, relationships, business rules, constraints, and design standards.

The objective is to build a secure, scalable, normalized, and maintainable PostgreSQL database that supports both Marketplace and Student Services.

---

# 2. System Overview

Campus Hub is a Telegram Mini App designed for Hawassa University students.

The system enables students to:
- Register using their Telegram account
- Buy and sell products
- Advertise personal services
- Bookmark listings and services
- Report inappropriate content

Administrators can:
- Review user accounts
- Activate or suspend users
- Moderate listings and services
- Manage categories

---

# 3. Technology Stack

| Component | Technology |
|-----------|------------|
| Database | PostgreSQL |
| ORM | Prisma |
| Backend | Node.js + Express |
| Storage | Supabase Storage |
| Hosting | Render |

---

# 4. Database Design Principles

The database is designed according to the following principles:
- Third Normal Form (3NF)
- Referential Integrity
- Minimal Data Duplication
- Scalability
- Security
- Maintainability
- PostgreSQL Best Practices

---

# 5. Core Entities

| Entity | Description |
|---------|-------------|
| User | Stores student account information |
| Listing | Marketplace products |
| ServiceProfile | Student service advertisements |
| Category | Shared categories for Marketplace and Services |
| Bookmark | Saved listings or services |
| Report | User reports for moderation |

---

# 6. Business Rules

1. Every new user starts with **PENDING** status.
2. Only **ACTIVE** users may create Listings or Service Profiles.
3. Marketplace listings expire automatically after **40 days**.
4. A user cannot bookmark the same target more than once.
5. A user cannot report the same target more than once.
6. Categories are shared between Marketplace and Service modules.

---

# 7. Primary Keys

| Table | Primary Key | PostgreSQL Type |
|--------|-------------|-----------------|
| User | telegramId | BIGINT |
| Listing | id | UUID |
| ServiceProfile | id | UUID |
| Category | id | INTEGER |
| Bookmark | id | UUID |
| Report | id | UUID |

---

# 8. Relationships

- One User can create many Listings.
- One User can create many Service Profiles.
- One Category can contain many Listings.
- One Category can contain many Service Profiles.
- One User can create many Bookmarks.
- One User can create many Reports.

---

# 9. Database Constraints

The following constraints will be enforced:

### Primary Keys
Every table has a primary key.

### Foreign Keys
- Listing → User
- Listing → Category
- ServiceProfile → User
- ServiceProfile → Category
- Bookmark → User
- Report → User

### Unique Constraints
- Bookmark (userId, targetId, targetType)
- Report (reporterId, targetId, targetType)

### Default Values
- User.status = PENDING
- Listing.status = ACTIVE
- Listing.expiresAt = createdAt + 40 days

### Validation Rules
- Listing.price must be greater than or equal to zero.
- yearOfStudy must be a positive number.

---

# 10. Indexing Strategy

Indexes will be created to improve query performance.

Planned indexes include:
- Listing(sellerId)
- Listing(categoryId)
- Listing(status)
- Listing(expiresAt)
- ServiceProfile(providerId)
- ServiceProfile(categoryId)
- Bookmark(userId)
- Report(status)

Composite indexes will be added where appropriate.

---

# 11. Naming Standards

The following naming conventions are used throughout the project:
- Tables use singular names.
- Fields use camelCase.
- Foreign keys end with **Id**.
- Enum names use PascalCase.
- Enum values use UPPER_SNAKE_CASE.
- Every entity contains **createdAt** and **updatedAt** timestamps.

---

# 12. Normalization

The database follows Third Normal Form (3NF).

Design goals include:
- Eliminate redundant data
- Store each fact only once
- Use foreign keys instead of duplicated information
- Improve consistency and maintainability

---

# 13. Referential Integrity

Foreign key constraints ensure that:
- Listings cannot exist without valid users.
- Services cannot exist without valid providers.
- Categories must exist before being referenced.
- Orphan records cannot be created.

---

# 14. Future Improvements

Future versions may include:
- Messaging
- Notifications
- Reviews & Ratings
- Search History
- Admin Logs
- Analytics
- Audit Trail
- Soft Deletes
