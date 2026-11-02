# QueueWise
### Hospital Appointment Booking & Smart Queue Management System

QueueWise is a user-centered web application designed to simplify hospital appointment scheduling and improve the patient waiting experience through digital token generation and queue tracking.

The application allows patients to book appointments, check in, receive virtual queue tokens and monitor their waiting position. Hospital staff can manage appointments, call patients and update queue statuses through a separate administrative interface.

## Project Overview

Traditional hospital queues often involve long waiting times, overcrowding and uncertainty about when patients will be attended to.

QueueWise addresses this problem by introducing a digital queue management experience that makes the waiting process more transparent, organized and convenient.

**Primary focus:** Smart Queue Management.

**Supporting functionality:** Hospital Appointment Booking.

## Key Features

### Patient Interface
- Patient dashboard with appointment and queue overview.
- Hospital department and doctor selection.
- Step-by-step appointment booking.
- Appointment history and cancellation.
- Digital token generation through patient check-in.
- Queue position and estimated waiting-time tracking.
- Queue status updates.

### Hospital Staff Interface
- Staff dashboard with queue statistics.
- Department-wise and doctor-wise queue management.
- First-In, First-Out (FIFO) queue processing.
- Call Next patient functionality.
- Consultation completion and token cancellation.
- Queue status management.

## Technology Stack

- Frontend: React
- Programming Language: JavaScript / TypeScript (verify against the project source)
- Styling: CSS / Tailwind CSS (verify against the project source)
- Development Environment: Lovable
- Version Control: Git and GitHub

## Usability Principles

The application follows the three usability principles:

**1. Perceivable**
- Readable text and appropriate colour contrast.
- Clear queue indicators and status labels.
- Proper form labels and visual feedback.

**2. Operable**
- Keyboard-accessible controls.
- Clear navigation.
- Visible interactive states.

**3. Understandable**
- Simple appointment booking process.
- Consistent navigation and layout.
- Clear instructions and validation messages.

## Application Workflow

### Patient Workflow
1. Open the patient dashboard.
2. Select a hospital department.
3. Choose a doctor and available appointment slot.
4. Enter basic details and confirm the appointment.
5. Check in on the appointment date.
6. Receive a digital queue token.
7. Track queue position and estimated waiting time.

### Staff Workflow
1. Switch to Staff mode.
2. View department-wise queues.
3. Select a doctor's queue.
4. Call the next patient.
5. Complete the consultation.
6. Automatically update queue and appointment status.

## Queue Management Logic

QueueWise uses the First-In, First-Out (FIFO) principle.

Patients are served in the order in which they check in.

Estimated waiting time is calculated using:

Estimated Waiting Time = People Ahead × 5 minutes

The waiting time is a simplified estimate for demonstration purposes.

## Running the Project Locally

### Prerequisites
- Node.js
- npm
- Git
- Visual Studio Code (recommended)

### Installation

Clone the repository:

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Navigate into the project directory:

```bash
cd QueueWise
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in your terminal.

## Project Scope

This is an academic prototype developed for the course **Usability Design of Software Applications**.

Appointment records, digital tokens and queue operations are simulated for demonstration purposes. The application is not connected to actual hospitals, doctors or healthcare systems.

No real patient medical information is collected.

## Team Members

- Parimal Ramprasad Appaka
- Athul
- Anamika

## Academic Purpose

Developed as part of Project Review-1 for the course Usability Design of Software Applications.

The project demonstrates user-centered design, usability principles, accessible interface design, intuitive navigation and simplified queue management.

---
**QueueWise – Making hospital waiting simpler and more transparent.**
