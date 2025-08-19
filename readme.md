# 🔬 Optical Setup Designer Web App  

![React](https://img.shields.io/badge/Frontend-ReactJS-61dafb?logo=react&logoColor=white)  
![Node](https://img.shields.io/badge/Backend-ExpressJS-green?logo=node.js&logoColor=white)  
![Deploy](https://img.shields.io/badge/Deploy-Netlify%20%26%20Render-blue)  
![License](https://img.shields.io/badge/License-MIT-lightgrey)  

## 📌 Project Overview  
The **Optical Setup Designer** is a web-based application for **designing and simulating optical experiments**.  
Users can visually place and manipulate optical components, adjust their properties, and simulate how light rays interact with the system.  

👉 **Live Demo**  
- 🌐 Frontend: [https://optical-design.netlify.app/](https://optical-design.netlify.app/)  
- ⚙️ Backend: [https://optical-designer-2.onrender.com/](https://optical-designer-2.onrender.com/)  

---

## 🎯 Features  

### 🖥️ Frontend (ReactJS)  
- Drag-and-drop grid for building optical setups.  
- Components: **Source, Mirror, Lens, Detector**.  
- Move, rotate, and edit properties:  
  - Mirror → angle, reflectivity  
  - Lens → focal length  
  - Source → angle of incidence  
- Visualize **light rays** interacting with components.  
- **Frequency sweep controls** (start, stop, number of points).  
- Export setup as a **JSON file**.  

### ⚙️ Backend (ExpressJS)  
- Accepts JSON setups from frontend.  
- Processes ray paths, calculates path lengths.  
- Performs **frequency sweep simulations**.  
- Returns results for visualization in frontend.  

---

## 📂 Tech Stack  

- **Frontend:** ReactJS, TailwindCSS, React DnD, Canvas/SVG for visualization  
- **Backend:** Node.js, ExpressJS  
- **Deployment:** Netlify (Frontend), Render (Backend)  

---

## 🚀 Getting Started  

### 1️⃣ Clone the repository  
```bash
git clone https://github.com/your-repo/optical-designer.git
cd optical-designer
