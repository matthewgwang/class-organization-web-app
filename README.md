# Slate: The Student Dashboard

[![Live Site](https://img.shields.io/badge/Live%20Site-Launch%20App-blueviolet)](https://[YOUR_PROJECT_ID].web.app)

A web app for students to manage classes, assignments, and schedules. Features a drag-and-drop Kanban board and a weekly calendar, with all data synced in real-time to your Google account via Firebase.

![Slate Screenshot](https://i.imgur.com/your-screenshot-url.png)
_Note: Replace this with a real screenshot of your app!_

---

## Features

*   **Secure Google Sign-In:** Uses Firebase Authentication for user accounts.
*   **Real-Time Data Sync:** All data is saved and synced instantly with Cloud Firestore.
*   **Dynamic Dashboard:** At-a-glance view of upcoming deadlines and today's schedule.
*   **Interactive Calendar:** A weekly schedule with support for recurring classes and single events.
*   **Kanban Board:** Visually track and manage assignment progress with drag-and-drop.
*   **Live Deployment:** Hosted globally with Firebase Hosting.

---

## Tech Stack

*   **Front-End:** ![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
*   **Back-End:** ![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase&logoColor=white) (Authentication, Firestore, Hosting)

---

## Running Locally

1.  **Prerequisites:**
    *   [Node.js](https://nodejs.org/) installed
    *   Firebase CLI: `npm install -g firebase-tools`

2.  **Clone & Setup:**
    ```sh
    # Clone the repository
    git clone https://github.com/[YOUR_GITHUB_USERNAME]/[YOUR_PROJECT_NAME].git
    cd [YOUR_PROJECT_NAME]
    ```

3.  **Configure Firebase:**
    *   Create a new project in the [Firebase Console](https://console.firebase.google.com/).
    *   Add a new Web App and copy the `firebaseConfig` object into `script.js`.
    *   Enable **Google** as a sign-in provider in Authentication.
    *   Add `localhost` and `127.0.0.1` as Authorized domains.
    *   Create a **Cloud Firestore** database.

4.  **Launch:**
    *   Use the **Live Server** extension in VS Code/Cursor (Right-click `index.html` -> `Open with Live Server`).

---

## Deployment

Deploy any changes to the live site with a single command:
```sh
firebase deploy
