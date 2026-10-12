# Submission to 2025 Solana Colosseum

## Submission by:

Roman Jaishibekov (https://www.instagram.com/mrromenion/)

Batumukhammed Beksultan (https://x.com/cil_mann41719) (https://github.com/BATU994)

Kanat Aldabek (https://www.instagram.com/kaneke_design/) (https://www.behance.net/45ba0a97)

Galymbek Muratbay (https://www.behance.net/galymbemuratba) (https://smart-directions-578401.framer.app/)

Magzhan Skakov (https://github.com/vcffff) (https://x.com/MagzhanSka21914)

# Resources

Figma Presentation:
https://www.figma.com/design/UGZgBUPgD1J84hAntjveDQ/Agrolink-Presentation?node-id=0-1&t=BHxovqjxbHm4FPnz-1

Platform (Demo):
https://aeroroute-rho.vercel.app/

Landing Page:
https://aeroroute-landing-page.vercel.app/

Demo Video:
[Add AeroRoute demo video URL]

Repository:
[Add AeroRoute repository URL]

# Problem and solution

Urgent deliveries of documents, medicines, and lightweight parcels can be delayed by road traffic.

Independent drone operators need a shared platform to discover delivery requests, coordinate pickups and handoffs, and receive payment.

## Our Solution

AeroRoute proposes a drone delivery marketplace connecting customers directly with independent drone operators.

Customers select pickup and destination points, provide parcel details, and request a delivery. Operators would accept available requests, complete deliveries, and receive payment through a Solana escrow program.

The proposed delivery flow:

1. **Request:** The customer selects a route and enters parcel details.
2. **Fund:** The customer connects a Solana wallet and funds the delivery escrow.
3. **Deliver:** An operator accepts the request and provides delivery-status updates.
4. **Confirm:** Delivery is verified before payment is released to the operator.

Cloud Firestore is planned for delivery records and real-time updates. Solana is planned for escrow funding and payment settlement.

The concept follows a DePIN model: independently operated drones connected through a shared marketplace and blockchain payment infrastructure.

# Summary of Submission Features

## Current Interactive Prototype

Responsive AeroRoute landing page with customer and operator information.

Route calculator interface with pickup and destination fields.

Parcel categories with illustrative pricing and delivery-time estimates.

Out-of-coverage state with ground-delivery messaging.

Visual flight-route preview with sample telemetry.

Delivery-process explanation and frequently asked questions.

## Planned Product Capabilities

Customer and operator authentication with separate dashboards.

Delivery-request creation and operator acceptance.

Drone registration and fleet management.

Firestore-backed real-time delivery-status updates.

Solana wallet connection and escrow funding.

Verified handoff and operator payouts.

Cancellation and refund handling.

**Current scope:** AeroRoute is a frontend prototype. Prices, delivery times, and flight telemetry are illustrative. Authentication, live tracking, drone operations, and escrow payments are planned integrations.

# Tech Stack

UI: Next.js, React, TypeScript.

Styling: CSS and utility-style classes.

Demo State Management: React component state.

Development Server: Next.js, configured to run on port 5173.

Planned Delivery Data and Tracking: Cloud Firestore.

Planned Blockchain Integration: Solana Web3.js and wallet-adapter.

Planned Payment Settlement: Solana escrow program.

Exact package versions and available scripts are defined in the project's `package.json` and lockfile.

# Architecture

Target delivery architecture. Backend coordination, tracking, verification, and settlement are planned integrations.

```mermaid
flowchart TD
    C["Customer"] --> W["AeroRoute web app"]
    O["Drone operator"] --> W
    W --> B["Backend: authorization and coordination"]
    B --> F["Firestore: requests and tracking"]
    F --> W
    B --> V["Delivery verification"]
    W --> S["Solana escrow"]
    V --> S
    S --> P["Operator payout or eligible refund"]
```

The web app would provide customer and operator interfaces.

The backend would authorize actions and coordinate delivery states.

Cloud Firestore would store delivery requests and distribute tracking updates.

An authorized verification mechanism would confirm the physical handoff before the Solana escrow releases payment.

# Quick Start Guide

## 1. Open the frontend project

Open a terminal in the directory containing the frontend's `package.json`.

If you are already in the `aeroroute` directory:

```bash
cd AgroLink
```

## 2. Install dependencies

Use a Node.js version compatible with the Next.js version installed in the project.

```bash
npm install
```

## 3. Start the development server

```bash
npm run dev
```

The current development script runs:

```bash
next dev --hostname 127.0.0.1 --port 5173
```

Open:
http://127.0.0.1:5173/

If the script is changed, use the local URL printed in the terminal.

## 4. Available scripts

To list the commands configured in the project:

```bash
npm run
```

If a build script is configured:

```bash
npm run build
```

## Tech notes

The current frontend prototype requires no external API credentials.

Route previews, prices, delivery times, and telemetry use illustrative data.

Live delivery tracking requires the planned Firestore integration.

Wallet funding, escrow settlement, and refunds require the planned Solana integration.

Physical delivery verification must be implemented before automated payouts can be enabled.

Platform:
https://aeroroute-rho.vercel.app/

Landing Page:
https://aeroroute-landing-page.vercel.app/
