# Contributing to Academix Cloud

First off, thank you for considering contributing to Academix Cloud! 🎉 It's people like you that make this project better for everyone.

This document provides guidelines and instructions for contributing to the project. Please take a moment to review this document to make the contribution process smooth and effective for everyone involved.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)
- [Feature Requests](#feature-requests)
- [Documentation](#documentation)
- [Testing](#testing)
- [Project Structure](#project-structure)

## 📜 Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Be open to different viewpoints and experiences

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/full-stack-school-main.git
   cd full-stack-school-main
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/original-owner/full-stack-school-main.git
   ```
4. **Create a branch** for your contribution:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

## 💻 Development Setup

### Prerequisites

Ensure you have the following installed:
- **Node.js** 18.x or higher
- **npm**, **yarn**, or **pnpm**
- **PostgreSQL** 15+ (or Docker)
- **Git**

### Initial Setup

1. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

2. **Set up environment variables**:
   
   Copy `.env.example` to `.env.local` (create if it doesn't exist) and fill in the required values:
   ```bash
   cp .env.example .env.local
   ```
   
   Required environment variables:
   - `DB_URL` - PostgreSQL connection string
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
   - `CLERK_SECRET_KEY` - Clerk secret key
   - Other optional variables as needed

3. **Set up the database**:
   ```bash
   # Generate Prisma Client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate dev
   
   # (Optional) Seed with sample data
   npm run db:seed
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Verify the setup**:
   
   Open [http://localhost:3000](http://localhost:3000) and verify the application loads correctly.

## 🤝 How to Contribute

### Types of Contributions

We welcome various types of contributions:

- 🐛 **Bug Fixes**: Fix issues and improve stability
- ✨ **New Features**: Add new functionality
- 📚 **Documentation**: Improve documentation and examples
- 🎨 **UI/UX Improvements**: Enhance user interface and experience
- ⚡ **Performance**: Optimize code and improve performance
- 🧪 **Tests**: Add or improve test coverage
- 🔧 **Refactoring**: Improve code structure and maintainability

### Contribution Workflow

1. **Check existing issues** to see if your contribution is already being worked on
2. **Create an issue** (if needed) to discuss your proposed changes
3. **Fork and clone** the repository
4. **Create a feature branch** from `main`:
   ```bash
   git checkout main
   git pull upstream main
   git checkout -b feature/your-feature-name
   ```
5. **Make your changes** following our coding standards
6. **Test your changes** thoroughly
7. **Commit your changes** using our commit message format
8. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
9. **Create a Pull Request** on GitHub

## 📝 Coding Standards

### TypeScript

- **Use TypeScript** for all new code
- **Enable strict mode** (already configured)
- **Define types** for all function parameters and return values
- **Use interfaces** for object shapes, types for unions/intersections
- **Avoid `any`** - use `unknown` if type is truly unknown
- **Use type inference** where appropriate

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ Bad
function getUser(id: any): any {
  // ...
}
```

### React/Next.js

- **Use functional components** with hooks
- **Use TypeScript** for component props
- **Follow Next.js 14 App Router** conventions
- **Use Server Components** by default, Client Components when needed
- **Add `"use client"`** directive only when necessary
- **Use proper file naming**: `PascalCase.tsx` for components, `camelCase.ts` for utilities

```typescript
// ✅ Good - Server Component
export default function StudentList() {
  // Server component logic
}

// ✅ Good - Client Component
"use client"
import { useState } from "react"

export default function InteractiveForm() {
  const [state, setState] = useState()
  // Client component logic
}
```

### Component Structure

- **Keep components small** and focused on a single responsibility
- **Extract reusable logic** into custom hooks
- **Use composition** over inheritance
- **Follow the component hierarchy**:
  ```typescript
  // 1. Imports (external, internal, types)
  import { useState } from "react"
  import { Button } from "@/components/ui/button"
  import type { Student } from "@/types"
  
  // 2. Types/Interfaces
  interface Props {
    student: Student
  }
  
  // 3. Component
  export default function StudentCard({ student }: Props) {
    // Component logic
  }
  ```

### Styling

- **Use Tailwind CSS** for styling
- **Follow mobile-first** approach
- **Use design system** components from `@/components/ui`
- **Maintain consistency** with existing styles
- **Use CSS variables** for theming (already configured)

```typescript
// ✅ Good
<div className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-md">
  <h2 className="text-2xl font-bold text-gray-900">Title</h2>
</div>

// ❌ Bad
<div style={{ padding: "24px", backgroundColor: "white" }}>
  <h2 style={{ fontSize: "24px", fontWeight: "bold" }}>Title</h2>
</div>
```

### File Organization

- **Use path aliases** (`@/components`, `@/lib`, `@/hooks`)
- **Group related files** together
- **Use index files** for cleaner imports
- **Follow the existing structure**:
  ```
  src/
  ├── app/          # Next.js app router pages
  ├── components/   # React components
  ├── hooks/        # Custom React hooks
  ├── lib/          # Utility functions
  └── types/        # TypeScript type definitions
  ```

### Database & Prisma

- **Always create migrations** for schema changes:
  ```bash
  npx prisma migrate dev --name your-migration-name
  ```
- **Update Prisma schema** before creating migrations
- **Use meaningful model and field names**
- **Add proper relations** and constraints
- **Document complex relationships** in comments

```prisma
// ✅ Good
model Student {
  id        String   @id @default(cuid())
  name      String
  email     String?  @unique
  enrollments Enrollment[]
  
  @@index([email])
}
```

### API Routes

- **Use Next.js API Routes** in `src/app/api/`
- **Handle errors** properly with try-catch
- **Return appropriate HTTP status codes**
- **Validate input** using Zod schemas
- **Use proper TypeScript types**

```typescript
// ✅ Good
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    // Process data
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid input" },
      { status: 400 }
    )
  }
}
```

### Form Validation

- **Use Zod** for schema validation
- **Use React Hook Form** for form management
- **Define schemas** in `src/lib/formValidationSchemas.ts`
- **Provide clear error messages**

### Code Quality

- **Run ESLint** before committing:
  ```bash
  npm run lint
  ```
- **Fix all linting errors** before submitting PR
- **Keep functions small** and focused
- **Use meaningful variable names**
- **Add comments** for complex logic
- **Remove unused code** and imports

## 📋 Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring without bug fixes or features
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates
- `ci`: CI/CD changes

### Examples

```bash
# Feature
feat(students): add bulk import functionality

# Bug fix
fix(attendance): correct date calculation for attendance records

# Documentation
docs(readme): update installation instructions

# Refactoring
refactor(api): simplify fee calculation logic

# Performance
perf(dashboard): optimize student list rendering
```

### Commit Best Practices

- **Write clear, descriptive commit messages**
- **Keep commits atomic** (one logical change per commit)
- **Reference issues** in commit messages: `fix(students): resolve #123`
- **Use present tense** ("add feature" not "added feature")
- **Limit subject line to 72 characters**

## 🔄 Pull Request Process

### Before Submitting

1. **Update your branch** with the latest changes from `main`:
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-branch
   git rebase main
   # or
   git merge main
   ```

2. **Run linting and type checking**:
   ```bash
   npm run lint
   npx tsc --noEmit
   ```

3. **Test your changes** thoroughly

4. **Update documentation** if needed

### PR Checklist

- [ ] Code follows the project's style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated (if applicable)
- [ ] No new warnings or errors
- [ ] Tests pass (if applicable)
- [ ] Changes are backward compatible (or migration guide provided)
- [ ] Commit messages follow the guidelines

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## Testing
Describe the tests you ran and how to verify your changes

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

### Review Process

1. **Automated checks** will run (linting, type checking)
2. **Maintainers will review** your PR
3. **Address feedback** by pushing new commits to your branch
4. **Once approved**, a maintainer will merge your PR

## 🐛 Reporting Issues

### Before Reporting

- **Check existing issues** to avoid duplicates
- **Verify the issue** still exists in the latest version
- **Gather information** about your environment

### Issue Template

```markdown
**Describe the bug**
A clear and concise description of the bug.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 120]
- Node version: [e.g., 18.17.0]
- Version: [e.g., 0.1.0]

**Additional context**
Any other relevant information.
```

### Bug Report Guidelines

- **Use clear, descriptive titles**
- **Provide step-by-step reproduction steps**
- **Include error messages** and stack traces
- **Add screenshots** for UI issues
- **Specify environment** details

## 💡 Feature Requests

We welcome feature requests! Please:

1. **Check existing issues** to see if it's already requested
2. **Create a new issue** with the `enhancement` label
3. **Describe the feature** clearly
4. **Explain the use case** and benefits
5. **Provide examples** if possible

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features.

**Additional context**
Any other relevant information.
```

## 📚 Documentation

### Documentation Standards

- **Keep documentation up-to-date** with code changes
- **Use clear, concise language**
- **Include code examples** where helpful
- **Update README.md** for significant changes
- **Add JSDoc comments** for complex functions

### Documentation Types

- **README.md**: Project overview and setup
- **Code comments**: Inline documentation
- **API documentation**: For API routes
- **Component documentation**: For reusable components

## 🧪 Testing

### Testing Guidelines

- **Test your changes** before submitting
- **Test edge cases** and error scenarios
- **Verify backward compatibility**
- **Test on different browsers** (if UI changes)
- **Test with different data** scenarios

### Manual Testing Checklist

- [ ] Feature works as expected
- [ ] No console errors
- [ ] Responsive design works
- [ ] Forms validate correctly
- [ ] Error handling works
- [ ] Loading states display properly

## 📁 Project Structure

Understanding the project structure helps with contributions:

```
full-stack-school-main/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Database migrations
│   └── seed.ts             # Seed data
├── public/                 # Static assets
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (dashboard)/    # Protected dashboard routes
│   │   ├── api/            # API routes
│   │   └── layout.tsx      # Root layout
│   ├── components/         # React components
│   │   ├── ui/             # shadcn/ui components
│   │   └── ...             # Feature components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   └── types/              # TypeScript types
├── .eslintrc.json          # ESLint configuration
├── tailwind.config.ts      # Tailwind configuration
└── tsconfig.json           # TypeScript configuration
```

## 🎯 Areas for Contribution

We're always looking for help in these areas:

- **Bug fixes**: Check open issues labeled `bug`
- **Documentation**: Improve guides and examples
- **UI/UX**: Enhance user experience
- **Performance**: Optimize slow queries and components
- **Accessibility**: Improve a11y compliance
- **Internationalization**: Add multi-language support
- **Testing**: Increase test coverage
- **Security**: Identify and fix security issues

## ❓ Getting Help

If you need help:

1. **Check the documentation** first
2. **Search existing issues** for similar problems
3. **Ask in discussions** or create a new issue
4. **Be patient** - maintainers are volunteers

## 🙏 Recognition

Contributors will be:

- **Listed in CONTRIBUTORS.md** (if applicable)
- **Mentioned in release notes** for significant contributions
- **Thanked in the project** for their efforts

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Academix Cloud! Your efforts help make this project better for everyone. 🚀

If you have any questions about contributing, please open an issue or contact the maintainers.
