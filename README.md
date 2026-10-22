# Campus Lost & Found Board

A fully responsive, modern React and Tailwind CSS web application designed to help students easily report, search, filter, and claim misplaced items around campus.

🔗 **Live Demo:** [Campus Lost & Found Board Live](https://foundry-rho-eight.vercel.app)

---

## Features & Highlights

- **Dynamic Item Cards:** Displays clean cards featuring item images, names, category tags, specific campus locations, dates, and clear status badges (*Lost* or *Found*).
- **Advanced Search & Filtering:** Real-time search across item names, locations, and descriptions, paired with instant dropdown filters for item status and categories.
- **Sorting Options:** Instantly sort items by newest or oldest.
- **Posting Modal & Image Preview:** A dedicated modal form allowing users to submit new items complete with local image file previewing.
- **Direct Contact Integration:** Click "Get in touch" on any card to instantly open a pre-filled Gmail compose tab targeting the item owner or finder.

---

## Tech Stack & Architecture

- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons
- **State Management:** React Local State & browser `localStorage` synchronization for persistence across browser reloads.
- **Hosting & Deployment:** Vercel

---

## Local Setup & Installation

To run this project locally on your machine, open your terminal and run:

```bash
# Clone the repository
git clone [https://github.com/Omh-Varma/LostAndFound.git](https://github.com/Omh-Varma/LostAndFound.git)

# Navigate into the project folder
cd LostAndFound

# Install dependencies
npm install

# Start the development server
npm run dev
