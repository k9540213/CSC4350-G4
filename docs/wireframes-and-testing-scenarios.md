# Pathway Wireframes and Testing Scenarios

## Project Summary

Pathway is a job application tracker for job seekers. Users can create an account, connect Gmail, automatically track application-related emails, manually add job applications, view their job search pipeline, review analytics, and generate tailored resumes from a saved resume profile.

## Wireframes

The wireframe board is available at:

`docs/pathway-wireframes.html`

It includes mockups for these screens:

1. Landing page
2. Sign in / create account
3. Gmail onboarding and scan calibration
4. Dashboard with Kanban view, filters, detail drawer
5. Add application dialog and table view
6. Analytics dashboard
7. Resume Workshop
8. Resume Profile editor
9. Settings

## Testing Scenarios

1. User opens the dashboard, searches for a company by name, sees matching applications, and quits.
   - Matching unit test: `frontend/src/__tests__/search-filter.test.ts`

2. User opens the dashboard, filters applications by the interview stage, clears the stage filter by selecting all stages, and quits.
   - Matching unit test: `frontend/src/__tests__/stage-filter.test.ts`

3. User opens the dashboard, clicks add application, enters a company, position, and stage, saves the application, and quits.
   - Matching unit test: `frontend/src/__tests__/add-application.test.ts`

4. User opens analytics, selects a date range, reviews total applications, response rate, and ghosted count, then quits.
   - Matching unit test: `frontend/src/__tests__/analytics.test.ts`

## How To Run Tests

From the frontend folder:

```bash
cd frontend
npm test
```

The tests use Vitest.
