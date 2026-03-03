# Anabolic Food

A web application for fitness-oriented recipe management with a calorie calculator, built with Node.js, Express, TypeScript, and PostgreSQL.

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap_5-7952B3?logo=bootstrap&logoColor=white)](https://getbootstrap.com/)

---

## About the Project

Anabolic Food is a full-stack web application designed for fitness enthusiasts who want to browse, create, and manage high-protein recipes tailored for bulking and cutting phases. The app includes a multi-step calorie calculator, a recipe rating system, and user authentication.

### Key Features

- **Recipe management** – create, edit, delete, and browse recipes with photos, ingredients, and nutritional values
- **Calorie calculator** – multi-step wizard calculating daily caloric needs based on gender, weight, height, age, activity level, and goal (bulk/cut)
- **User authentication** – registration & login with bcrypt password hashing and Passport.js local strategy
- **Recipe ratings & comments** – logged-in users can rate recipes (1–5) and leave comments
- **Search & filtering** – search recipes by name, filter by diet, ingredients, and meal type
- **My Recipes** – personal dashboard showing only the user's own recipes
- **Responsive UI** – dark-themed Bootstrap 5 interface with carousel and photo gallery on the home page

---

## Technologies

| | |
|---|---|
| **Language** | TypeScript (Node.js) |
| **Framework** | Express 4 |
| **Database** | PostgreSQL (pg) |
| **Templating** | EJS |
| **Auth** | Passport.js (Local Strategy) + bcrypt |
| **Sessions** | express-session + memorystore |
| **Styling** | Bootstrap 5 |
| **Build** | ts-node |

---

## Architecture

```
src/
├── controllers/          # Business logic
│   ├── authController.ts       # Login & registration
│   ├── calculatorController.ts # Calorie calculator (3-step wizard)
│   ├── homeController.ts       # Home page & static pages
│   ├── passport.ts             # Passport.js configuration
│   ├── ratingsController.ts    # Recipe rating system
│   └── recipesController.ts    # Full CRUD for recipes
├── middleware/
│   └── authMiddleware.ts       # Authentication guard
├── routes/               # Express route definitions
│   ├── auth.ts                 # /auth/*
│   ├── calculator.ts           # /calculator/*
│   ├── home.ts                 # / , /about, /contact, /login, /register
│   ├── ratings.ts              # /ratings/*
│   └── recipes.ts              # /recipes/*
├── types/
│   └── express.d.ts            # TypeScript type augmentations
├── db.ts                 # PostgreSQL connection pool
└── index.ts              # App entry point & middleware setup

views/
├── index.ejs             # Home page
├── pages/                # Page templates
│   ├── about.ejs
│   ├── contact.ejs
│   ├── edit_recipe.ejs
│   ├── login.ejs
│   ├── my_recipes.ejs
│   ├── recipes.ejs
│   ├── register.ejs
│   ├── secret.ejs              # Visible only to authenticated users
│   ├── single_recipe.ejs
│   └── calculator/
│       ├── calculator-step-one.ejs
│       ├── calculator-step-two.ejs
│       └── calculator-result.ejs
└── partials/             # Reusable EJS components
    ├── header.ejs
    ├── footer.ejs
    ├── carousel.ejs
    └── photos.ejs
```

### Key Design Patterns

- **MVC** – controllers handle logic, EJS views handle presentation, PostgreSQL models the data
- **Middleware pipeline** – authentication guard (`isAuthenticated`) protects routes requiring login
- **Session-based wizard** – multi-step calculator stores intermediate data in `req.session.userData`
- **Transactional writes** – recipe creation and updates use `BEGIN` / `COMMIT` / `ROLLBACK`

---

## Database Schema

The application uses the following PostgreSQL tables:

| Table | Description |
|---|---|
| `USERS` | User accounts (`user_id`, `email`, `username`, `password`) |
| `RECIPES` | Recipe data (`recipe_id`, `description`, `instruction`, `meal`, `making_time`, `bulk_cut`, `average_rating`, `user_id`) |
| `CALORIES` | Nutritional info per recipe (`calories`, `proteins`, `fats`, `carbs`) |
| `INGREDIENTS` | Ingredient dictionary (`ingredient_id`, `ingredient_name`) |
| `RECIPES_INGREDIENTS` | Many-to-many relation (`recipe_id`, `ingredient_id`, `quantity`, `unit`) |
| `PHOTOS` | Recipe photos (`photo_id`, `recipe_id`, `photo`) |
| `DIETS` | Diet types (`diet_id`, `diet_name`) |
| `DIET_RECIPES` | Many-to-many relation (`recipe_id`, `diet_id`) |
| `RATINGS` | User ratings & comments (`recipe_id`, `user_id`, `rating`, `comment`) |

---

## API Routes

| Method | Route | Description |
|---|---|---|
| `GET` | `/` | Home page with carousel & photo gallery |
| `GET` | `/about` | About page (secret page if authenticated) |
| `GET` | `/contact` | Contact page |
| `GET` | `/login` | Login page |
| `GET` | `/register` | Registration page |
| `POST` | `/auth/login` | Authenticate user |
| `POST` | `/auth/register` | Create new account |
| `GET` | `/auth/logout` | Logout & destroy session |
| `GET` | `/recipes` | Browse all recipes (supports `?q=` search) |
| `POST` | `/recipes/add_recipe` | Add new recipe 🔒 |
| `GET` | `/recipes/show_recipe/:id` | View single recipe with ratings |
| `GET` | `/recipes/my_recipes` | User's own recipes |
| `GET` | `/recipes/edit_recipe/:id` | Edit recipe form 🔒 |
| `POST` | `/recipes/edit_recipe/:id` | Update recipe 🔒 |
| `DELETE` | `/recipes/:id` | Delete recipe 🔒 |
| `POST` | `/ratings/:id` | Rate a recipe (1–5 + comment) |
| `GET` | `/calculator/step-one` | Calculator – step 1 (gender, weight, height, age) |
| `POST` | `/calculator/step-one` | Submit step 1 |
| `GET` | `/calculator/step-two` | Calculator – step 2 (activity, goal) |
| `POST` | `/calculator/step-two` | Submit step 2 |
| `GET` | `/calculator/result` | Calculator – result (daily calories) |

> 🔒 = requires authentication

---

## Getting Started

### Requirements

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/erybie222/Anabolic-Food.git
cd Anabolic-Food

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
```

### Running

```bash
# Development mode
npm run dev
```

The server starts at **http://localhost:3000**.

---

## TODO / Roadmap

- [ ] Image upload (file storage instead of URL)
- [ ] Advanced filtering (by macros, diet, meal type)
- [ ] User profile page
- [ ] Meal planner based on calculator results
- [ ] Responsive mobile improvements
- [ ] Unit & integration tests
- [ ] Docker compose setup for easy deployment

---

## Authors

- GitHub: [@erybie222](https://github.com/erybie222)
- GitHub: [@Kendrej](https://github.com/Kendrej)
