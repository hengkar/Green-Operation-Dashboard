# Green Ops Dashboard - GitHub Pages Deployment Guide

This guide explains how to host your **Green Ops Dashboard** on GitHub Pages as a fast, beautiful, and completely free static landing page.

---

## 🚀 Quick Setup (3 Minutes)

### Option 1: Direct File Upload via GitHub Web UI

1. Create a new repository on [GitHub](https://github.com/new), for example named `green-ops-dashboard`.
2. Choose **Public** repository visibility.
3. On the repository page, click **Add file** > **Upload files**.
4. Drag and drop the `standalone/index.html` file (rename it to `index.html` if needed).
5. Commit the file to the `main` branch.
6. In your GitHub repository:
   - Go to **Settings** > **Pages** (in the left sidebar).
   - Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
   - Under **Branch**, select `main` and folder `/ (root)`.
   - Click **Save**.
7. In about 30 seconds, your site will be live at:
   `https://<your-github-username>.github.io/green-ops-dashboard/`

---

### Option 2: Using the Command Line / Terminal

```bash
# 1. Create a folder for your landing page
mkdir green-ops-dashboard
cd green-ops-dashboard

# 2. Copy the standalone index.html here
cp path/to/standalone/index.html ./index.html

# 3. Initialize Git and commit
git init
git add index.html
git commit -m "feat: Add Green Ops Dashboard landing page"
git branch -M main

# 4. Link to your GitHub repository and push
git remote add origin https://github.com/<your-github-username>/green-ops-dashboard.git
git push -u origin main
```

Then enable GitHub Pages under **Settings** > **Pages** > Branch: `main` > Save.

---

## 🌟 Key Features of the HTML5 Landing Page

- **100% Self-Contained**: Single file `index.html`. Zero dependencies, zero build steps, zero node_modules.
- **Client-Side AI Audit Engine**: Evaluates facility totals (kWh per line, off-shift idle load, diurnal peak hour, and metric tons CO2e) to generate 3 actionable engineering recommendations quoting exact computed facility numbers.
- **Interactive Stacked Area Chart**: Daily kWh trends grouped by sub-meter line with hover tooltip and dynamic legend.
- **Line Breakdown Bar Chart**: Visualizes power share and highlights off-shift non-production shares.
- **Shift Filter Toggle**: Instant filtering between `All Hours`, `Production (Mon-Sat 07:00-23:00)`, and `Non-Production (Off-Shift)`.
- **1-Click Demo Plant Dataset**: Visitors can test the dashboard immediately with realistic 14-day manufacturing sub-meter records without needing their own CSV.
- **CSV Drag-and-Drop Parser**: Accepts standard industrial CSV files with columns `timestamp`, `line`, `kWh`.
