# CHANGELOG - CodeLife

All notable changes to the CodeLife project are documented in this file. Dates are in IST (Indian Standard Time).

---

## [0.3.0] - 2025-11-14

### Added
- **Enhanced User Profile Signup** (2025-11-14 12:50 AM IST)
  - Signup form now collects comprehensive user details: Name, Date of Birth, Gender, Country, State/Region, Institution/Organization
  - Integrated public APIs for dynamic dropdowns:
    - Countries: `https://restcountries.com/v3.1/all`
    - States: `https://countriesnow.space/api/v0.1/countries/states`
    - Universities: `http://universities.hipolabs.com/search?country={country}`
  - All user details stored in Firestore `users` collection with user UID as document ID
  - Updated `Signup.jsx` with comprehensive form validation and error handling

- **User Profile Endpoint Enhancement** (2025-11-14 12:50 AM IST)
  - Backend `/user/profile` endpoint now returns full user profile including: name, DOB, gender, country, state, institution
  - Firestore integration to fetch user details from `users` collection
  - Graceful handling of missing fields with default values

- **Enrolled Courses Endpoint** (2025-11-14 09:45 PM IST)
  - New backend endpoint `@router.get("/user/courses")` to retrieve user-enrolled courses
  - Fetches enrolled course list from Firestore `user_enrollments` collection
  - Returns empty list if user has no enrollments yet

- **Enrolled Courses Dashboard Component** (2025-11-14 09:45 PM IST)
  - New `EnrolledCoursesDashboard.jsx` component to display user's enrolled courses
  - Includes loading state, error handling, and empty state messaging
  - Integrated with API service for secure data fetching
  - Displays course title and description in a clean list format

- **System Architecture Documentation with Real-time Features** (2025-11-14 09:53 AM IST)
  - Updated architecture description to reflect Firebase Realtime Database (RTDB) for real-time features
  - Documented data flow for real-time notifications, dashboards, and messaging
  - Added support for Firebase Cloud Functions for serverless event-triggered logic
  - Clarified that WebSocket support is available if needed for future enhancements

### Changed
- **Backend Routes Structure** (2025-11-14 01:51 AM IST)
  - Updated `protected.py` to use `APIRouter(prefix="/user")` for consistent endpoint namespacing
  - All protected routes now follow `/user/{endpoint}` pattern

- **Dashboard Component Styling** (2025-11-14 01:33 AM IST)
  - Adjusted font colors for better contrast and aesthetic cohesion
  - Prepared for darker font color implementation and improved color schemes

- **Tools and Technologies Documentation** (2025-11-14 09:08 AM IST)
  - Removed PostgreSQL, MongoDB, Elasticsearch, Redis from primary tech stack
  - Clarified Firebase as the primary database and authentication platform
  - Updated tech stack to accurately reflect Firebase Firestore, Auth, and future Realtime Database usage

### Fixed
- **Dashboard API Endpoints** (2025-11-14 01:48 AM IST)
  - Resolved 404 "Not Found" errors on dashboard by properly registering protected routes
  - Ensured `/user/profile` and `/user/progress` endpoints are correctly exposed with `/user` prefix

- **Module Import Issues** (2025-11-14 01:35 AM IST)
  - Fixed missing `Badge` import in react-bootstrap components
  - Resolved all module resolution errors in frontend components

- **Learning Hub Component Missing Files** (2025-11-14 01:41 AM IST)
  - Created all missing Learning Hub component files:
    - `CoursesListPage.jsx`
    - `CourseDetailsPage.jsx`
    - `ProgressTrackingPage.jsx`

### Pending
- Logout confirmation dialog implementation
- Profile font color adjustments to darker shades
- Edit profile functionality
- Real-time notifications via Firebase RTDB or WebSocket

---

## [0.2.0] - 2025-11-13

### Added
- **User Progress Enhanced Structure** (2025-11-14 01:15 AM IST)
  - Implemented Firestore structure for `user_progress/{userId}_{courseId}_{lessonId}`:
    - Fields: `user_id`, `course_id`, `lesson_id`, `completed`, `quiz_score`, `quiz_completed`, `completed_at`, `achievements`
  - Created batch Python script to populate user progress documents

- **Batch User Progress Script** (2025-11-14 01:18 AM IST)
  - `create_user_progress.py` script for batch-creating user progress entries
  - Supports multiple users, courses, lessons with sample data
  - Seamless integration with existing Firebase Admin SDK setup

- **Learning Hub Frontend Components** (2025-11-13 - Earlier)
  - `CoursesListPage.jsx`: Display list of available courses
  - `CourseDetailsPage.jsx`: Show course details, lessons, and content
  - `ProgressTrackingPage.jsx`: Track user progress and achievements

- **Dashboard Component** (2025-11-13 - Earlier)
  - User profile display (email, UID, verification status)
  - Learning progress statistics (courses completed, labs completed)
  - Quick action buttons to navigate to learning modules
  - Logout functionality

### Fixed
- **Firestore Structure Alignment** (2025-11-14 01:15 AM IST)
  - Properly documented Firestore document structure and field types
  - Clarified manual vs. automated entry process

---

## [0.1.0] - 2025-11-13 (Initial Release)

### Added
- **Firebase Setup & Authentication**
  - Firebase Authentication integration for signup/login
  - JWT token handling in API requests
  - Protected route implementation with `verify_firebase_token`

- **Frontend Framework**
  - React.js with Bootstrap for UI
  - React Router for navigation
  - API service layer with `api.js` for authenticated requests

- **Backend Framework**
  - FastAPI with Python for REST API
  - CORS middleware configuration
  - Protected routes with Firebase token verification

- **Database Setup**
  - Firestore Cloud Database initialization
  - Collection structure for users, courses, lessons, quizzes, achievements

- **Learning Hub Core**
  - Course management (create, read courses)
  - Lesson management with articles, videos, quizzes
  - Quiz functionality with scoring
  - Achievement system with badges

- **Dashboard**
  - User profile information display
  - Learning progress summary
  - Quick navigation to learning modules

---

## Deprecations

- PostgreSQL (replaced by Firebase Firestore)
- Redis caching (handled by Firebase)
- Elasticsearch (not needed with Firestore)
- WebSocket communication (currently using REST; available for future real-time features)

---

## Migration Guide

### From v0.2.0 to v0.3.0

1. **Update Signup Component**
   - Replace old `Signup.jsx` with enhanced version that collects full user details
   - Ensure public API endpoints are accessible

2. **Update Backend Protected Routes**
   - Replace old `/profile` endpoint with new implementation that fetches from Firestore `users` collection
   - Add new `/courses` endpoint for enrolled courses

3. **Add Enrolled Courses Dashboard**
   - Create new component file at `src/components/EnrolledCoursesDashboard.jsx`
   - Add route to `App.js` pointing to `/my-courses`

4. **Update Firestore Queries**
   - Ensure `users` collection documents contain new fields: name, dob, gender, country, state, institution
   - Ensure `user_enrollments` collection exists with course enrollment data

---

## Known Issues

- None currently documented

---

## Future Roadmap

- Real-time notifications via Firebase Realtime Database
- Real-time collaboration features (chat, pair programming)
- WebSocket support for live dashboards
- Edit profile functionality
- Advanced analytics and reporting
- Mobile app (React Native)
- Microservices architecture for sandbox orchestration
- Enhanced AI/ML integration for adaptive learning

---

**Last Updated:** 2025-11-14 10:17 PM IST
**Version:** 0.3.0
