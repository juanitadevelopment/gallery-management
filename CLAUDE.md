# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Gallery Space Management System built with Vue.js 3 + TypeScript + Node.js + SQLite. It manages artwork, exhibition locations, and exhibition schedules for a small gallery with 10 display locations.

## Architecture

### Frontend (client/)
- **Framework**: Vue.js 3 with Composition API + TypeScript
- **Build Tool**: Vite
- **Router**: Vue Router (SPA)
- **HTTP Client**: Axios
- **Styling**: Custom CSS with responsive design

### Backend (server/)
- **Runtime**: Node.js with Express + TypeScript
- **Database**: SQLite with WAL mode for concurrency
- **API**: RESTful API with CORS enabled
- **Concurrency**: Transaction management with optimistic locking

### Database Design
- **artworks**: Stores artwork information (id, title, artist, detail_url)
- **locations**: Stores 10 exhibition locations (id, width, height, description)
- **exhibitions**: Manages exhibition schedule with conflict prevention

## Development Commands

### Root Level
```bash
npm run install:all    # Install all dependencies
npm run dev            # Start both client and server in parallel
npm run dev:server     # Start only server (port 3000)
npm run dev:client     # Start only client (port 5173)
npm run build          # Build client for production
```

### Server (server/)
```bash
npm run dev            # Start development server with hot reload
npm run build          # Compile TypeScript to JavaScript
npm run start          # Start production server
npm run lint           # Run ESLint
npm run format         # Format code with Prettier
```

### Client (client/)
```bash
npm run dev            # Start Vite development server
npm run build          # Build for production with type checking
npm run preview        # Preview production build
npm run lint           # Run ESLint and fix issues
npm run format         # Format code with Prettier
```

## Key Features Implementation

### 1. Concurrency Control
- SQLite WAL mode enabled for better concurrent access
- Optimistic locking using `updated_at` timestamps
- Transaction management for exhibition conflict prevention
- Proper error handling for busy database scenarios

### 2. Exhibition Conflict Prevention
- Unique constraint on (location_id, start_date, end_date)
- Real-time availability checking in frontend
- Transaction-based conflict detection in backend

### 3. Table Sorting
- Custom SortableTable component with multi-column support
- Supports ascending/descending/no-sort states
- Japanese locale-aware string comparison
- Date and number sorting capabilities

### 4. Form Validation
- Frontend validation with real-time feedback
- Backend validation with detailed error messages
- Optimistic locking conflict handling

## API Endpoints

### Artworks
- `GET /api/artworks` - List all artworks
- `POST /api/artworks` - Create new artwork
- `PUT /api/artworks/:id` - Update artwork
- `DELETE /api/artworks/:id` - Delete artwork

### Locations
- `GET /api/locations` - List all locations
- `PUT /api/locations/:id` - Update location
- `GET /api/locations/:id/availability` - Check availability
- `GET /api/locations/:id/schedule` - Get location schedule

### Exhibitions
- `GET /api/exhibitions` - List exhibitions (with filters)
- `POST /api/exhibitions` - Create exhibition
- `PUT /api/exhibitions/:id` - Update exhibition
- `DELETE /api/exhibitions/:id` - Delete exhibition
- `GET /api/exhibitions/current` - Get current exhibitions

### Database
- `GET /api/database/tables` - List all tables
- `GET /api/database/:table` - Get table data and schema
- `GET /api/database/stats/summary` - Get database statistics
- `GET /api/database/health` - Database health check

## Error Handling

### Common Error Responses
- `400` - Validation errors
- `404` - Resource not found
- `409` - Conflict (duplicate exhibitions, optimistic locking)
- `503` - Database busy (SQLite BUSY error)

### Frontend Error Display
- Alert components for success/error messages
- Form validation with field-specific errors
- Automatic data refresh on conflict resolution

## Database Schema Notes

### Indexes
- `idx_exhibitions_location_dates` - Performance for conflict checking
- `idx_exhibitions_artwork` - Performance for artwork queries
- `idx_exhibitions_status` - Performance for status filtering

### Foreign Keys
- Enabled with `PRAGMA foreign_keys = ON`
- Prevents deletion of referenced artworks/locations

## Component Structure

### Views
- `Home.vue` - Dashboard with statistics and current exhibitions
- `Artworks.vue` - Artwork management with CRUD operations
- `Locations.vue` - Location management and schedule viewing
- `Exhibitions.vue` - Exhibition management with conflict checking
- `Database.vue` - Raw database data viewing for debugging

### Components
- `Navigation.vue` - Responsive navigation with mobile menu
- `SortableTable.vue` - Reusable table with sorting capabilities

## Development Notes

### Type Safety
- Strict TypeScript configuration
- Comprehensive type definitions in `client/src/types/index.ts`
- No implicit any, strict null checks enabled

### Responsive Design
- Mobile-first approach with CSS Grid/Flexbox
- Responsive tables with horizontal scrolling
- Collapsible mobile navigation

### Security Considerations
- CORS properly configured
- SQL injection prevention with parameterized queries
- Input validation on both frontend and backend
- No secrets stored in code

## Testing the Application

1. Start both servers: `npm run dev`
2. Access frontend at `http://localhost:5173`
3. Test artwork CRUD operations
4. Test location management and schedule viewing
5. Test exhibition creation with conflict detection
6. Verify database health and statistics in Database view

## Database Initialization

The database is automatically initialized on server startup with:
- 10 predefined locations with sample data
- 5 sample artworks
- 4 sample exhibitions demonstrating different statuses

## Troubleshooting

### Database Issues
- Check health endpoint: `GET /api/database/health`
- Verify WAL mode and foreign keys are enabled
- Monitor for SQLITE_BUSY errors under load

### Concurrency Issues
- Look for optimistic locking conflict messages
- Check exhibition availability before creation/update
- Verify transaction rollback on conflicts

### Frontend Issues
- Check browser console for API errors
- Verify proxy configuration in vite.config.ts
- Ensure TypeScript compilation succeeds