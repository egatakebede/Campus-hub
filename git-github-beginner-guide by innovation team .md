# Git & GitHub — Beginner Guide for Campus Hub Team

A simple reference for everything you'll need day-to-day. Keep this open while you work.

---

## 0. Terminal Basics (before Git even makes sense)

You'll live in the terminal for this project. These are the commands you'll type constantly, outside of Git.

| Command | What it does |
|---|---|
| `pwd` | "Print working directory" — shows where you currently are |
| `ls` | Lists files/folders in your current location |
| `ls -la` | Same, but shows hidden files too (like `.gitignore`, `.git`) |
| `cd foldername` | Moves INTO a folder |
| `cd ..` | Moves UP one folder (out of the current one) |
| `cd ~` | Jumps straight to your home folder |
| `mkdir foldername` | Creates a new folder |
| `touch filename.js` | Creates a new empty file |
| `cat filename` | Shows the contents of a file, right in the terminal |
| `clear` | Clears the terminal screen (doesn't delete anything, just visual) |
| `Ctrl + C` | Stops whatever is currently running (e.g. stop the server) |

**A simple mental model:** the terminal is always "standing" in one folder at a time. `pwd` tells you where you're standing. `cd` moves you. `ls` shows you what's around you. Everything else (`git`, `npm`, etc.) acts on whatever folder you're currently standing in.

**Try this sequence to get comfortable:**
```bash
pwd
ls
cd Campus-hub
pwd
ls
cd ..
pwd
```
Watch how `pwd` changes each time you `cd`.

---

## 0.5 npm Basics (once you're inside the backend folder)

`npm` manages the project's dependencies (external code libraries) and lets you run the app.

| Command | What it does |
|---|---|
| `npm install` | Downloads all the packages the project needs (run this after cloning, and any time `package.json` changes) |
| `npm start` | Runs the app |
| `npm run dev` | Runs the app in "development mode" if the project has this script set up |
| `npm install packagename` | Adds a new package to the project (e.g. `npm install axios`) |

**First thing to do after cloning, every time:**
```bash
cd backend
npm install
```
This creates a `node_modules` folder — don't worry about what's inside it, and never touch or delete it manually.

---

## 0.6 Creating Multiple Folders & Files at Once

You don't need to create things one at a time — a few shortcuts save a lot of typing.

**Create several folders in one command:**
```bash
mkdir folder1 folder2 folder3
```

**Create nested folders in one go (folder inside a folder):**
```bash
mkdir -p src/controllers
```
The `-p` means "create any parent folders that don't exist yet" — without it, `mkdir` will error if `src` doesn't already exist.

**Create several nested folders at once:**
```bash
mkdir -p src/middleware src/controllers src/routes src/services
```

**Create several files at once:**
```bash
touch file1.js file2.js file3.js
```

**Create files inside a folder you just made:**
```bash
touch src/controllers/userController.js src/controllers/authController.js
```

**Combine both — the exact pattern we used to scaffold the backend:**
```bash
mkdir -p src/controllers src/routes && touch src/controllers/userController.js src/routes/users.js
```
The `&&` means "run the next command only if the first one succeeds" — a simple way to chain multiple commands into one line.

**A note on `&&` chains:** when you paste a long command like this, make sure it's really ONE line (no accidental line breaks) — a broken paste is the most common reason these commands fail with confusing errors.

---

## 1. One-Time Setup (only do this once per computer)

**Check if Git is installed:**
```bash
git -v
```
If you see a version number, you're good. If not, install Git from git-scm.com.

**Check if Node.js is installed:**
```bash
node -v
```
If not, install from nodejs.org (choose the LTS version).

**Tell Git who you are (only needed once):**
```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

---

## 2. Cloning the Project (getting the code onto your computer)

You only do this **once** per project.

```bash
git clone https://github.com/egatakebede/Campus-hub.git
cd Campus-hub
```

This downloads the whole project into a folder called `Campus-hub` and moves you into it.

---

## 3. Everyday Commands — The Core 6

You'll use these constantly. Memorize these first.

| Command | What it does |
|---|---|
| `git status` | Shows what files you've changed |
| `git add .` | Stages all your changes (prepares them to be saved) |
| `git commit -m "message"` | Saves your changes with a description |
| `git push` | Uploads your saved changes to GitHub |
| `git pull` | Downloads the latest changes from GitHub |
| `git branch` | Shows which branch you're currently on |

**Typical flow when you finish some work:**
```bash
git status
git add .
git commit -m "Added the profile endpoint"
git push
```

---

## 4. Branches — Why We Use Them

Think of a branch as your own private copy of the project to work in, so you don't accidentally break everyone else's code. We all work on **`dev`**, not `main`.

**See all branches:**
```bash
git branch -a
```

**Switch to an existing branch:**
```bash
git checkout dev
```

**Create a NEW branch (for your specific task) and switch to it in one step:**
```bash
git checkout -b your-name/your-task
```
Example:
```bash
git checkout -b sara/user-profile-endpoint
```

**Go back to a branch you already have:**
```bash
git checkout dev
```

---

## 5. Your Daily Workflow (step by step)

Every time you sit down to work:

```bash
git checkout dev
git pull
git checkout -b your-name/your-task
```

Now write your code. When you're ready to save progress:

```bash
git add .
git commit -m "describe what you did"
git push -u origin your-name/your-task
```

*(The `-u origin your-name/your-task` part is only needed the FIRST time you push a new branch. After that, just `git push`.)*

---

## 6. Creating a Pull Request (PR) — Asking for Your Code to Be Merged

Once your task is done and pushed:

1. Go to `github.com/egatakebede/Campus-hub`
2. You'll usually see a yellow banner: **"your-name/your-task had recent pushes"** with a **"Compare & pull request"** button — click it
3. Write a short title describing what you did (e.g. "Add user profile GET/PATCH endpoints")
4. Click **"Create pull request"**
5. Wait for a review — don't merge it yourself unless told to

That's it — your code is now waiting for someone to check it before it joins the main project.

---

## 7. Common Mistakes & Fixes

**"I'm on the wrong branch"**
```bash
git status        # tells you which branch you're on
git checkout dev  # go back to dev
```

**"I have changes I haven't saved and I want to switch branches"**
Save them first:
```bash
git add .
git commit -m "work in progress"
```
Then switch.

**"git pull says there's a conflict"**
Don't panic — message the group chat, this is normal and someone can help you resolve it together.

**"I forgot to pull before starting"**
```bash
git pull
```
Run this at the start of every session, before you start coding.

---

## 8. Quick Reference Card (print this mentally)

```
git clone <url>              → download the project (once)
git checkout dev             → switch to the dev branch
git pull                     → get latest changes
git checkout -b my-branch    → create + switch to a new branch
git add .                    → stage your changes
git commit -m "message"      → save your changes
git push                     → upload to GitHub
```

Then open GitHub → Compare & pull request → done.

---

## 9. Want to Go Deeper? Free Resources

You don't need any of these to start working today — this guide covers what you need. But if you want to actually understand what's happening under the hood, these are genuinely good and free:

**Terminal / Command Line:**
- Codecademy's "Learn the Command Line" — interactive lessons in the browser, no install needed
- freeCodeCamp's "Command Line for Beginners" — a full written handbook, explains terminal/console/shell clearly
- Terminal Tutor — free interactive site, side-by-side explanation and live terminal practice

**Git:**
- The Pro Git book — free, comprehensive, the resource most working developers keep bookmarked (git-scm.com/book)
- Learn Git Branching — a free, visual, interactive tutorial, probably the most intuitive way to actually see what branches are doing
- Scrimba's Command Line Basics — free, ~101 minutes

**GitHub specifically:**
- GitHub Skills — free interactive courses built directly into GitHub, with instant feedback; teaches your first pull request, first contribution, and more
- GitHub's own "Getting Started" docs (docs.github.com/en/get-started)
- freeCodeCamp's YouTube channel — covers Git, GitHub, branches, commits, and pull requests in one series

**A word of caution on courses:** a course that only covers add, commit, and push is teaching roughly 5% of Git — real projects need branching, conflict resolution, and team workflows too. This guide already covers branching and the team workflow, so you're ahead of that trap.

**My honest suggestion:** don't go read a book before starting. Use this guide to get moving today, and only reach for "Learn Git Branching" or the Pro Git book later, once you've actually hit a situation where you're curious *why* something worked the way it did.

---

**Golden rule:** always `git pull` before you start, always work on your own branch (never directly on `main` or `dev`), always ask if something looks confusing. Nobody expects you to memorize all of this today — bookmark this page and refer back as needed. 💚
