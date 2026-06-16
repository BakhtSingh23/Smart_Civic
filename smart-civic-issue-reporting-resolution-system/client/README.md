# SmartCivic Master Design System

This repository contains the comprehensive Design System for the SmartCivic platform, ensuring pixel-perfect consistency, professional animations, and a world-class UI/UX across all roles and pages.

## Core Features

- **Global Theming**: Powered by CSS variables in `src/styles/global.css` offering a dynamic color system, typography scale, spacing, border-radius, and shadow system.
- **Dark Mode**: Fully supported out-of-the-box. Handled via `data-theme="dark"` and `ThemeProvider` context.
- **Component Library**: Found in `src/components/ui/`, encompassing buttons, inputs, cards, modals, tables, badges, and alerts.
- **Animations**: Integrates GSAP for buttery-smooth micro-interactions, hover effects, modal transitions, and page transitions.
- **Accessibility**: Built with WCAG 2.1 AA standards in mind, including robust keyboard navigation, ARIA labels, and focus rings.

## File Structure

```
client/src/
├── theme/
│   └── themeConfig.js       # Color, spacing, typography variables programmatic export
├── styles/
│   ├── global.css           # CSS variables, typography, shadows, utilities
│   └── utilities.css        # Specific custom utilities
├── context/
│   └── ThemeContext.jsx     # Dark mode & Theme state management
├── components/ui/
│   ├── Button.jsx           # Animated, multi-variant button
│   ├── Input.jsx            # Form input with validation states
│   ├── Card.jsx             # Container with hover elevation
│   ├── Modal.jsx            # Animated dialog with portal
│   ├── Badge.jsx            # Status indicators
│   ├── Alert.jsx            # Dismissible notifications
│   └── Table.jsx            # Sortable data presentation
```

## Using Components

### Button
```jsx
import Button from '../components/ui/Button';

<Button variant="primary" size="md" onClick={handleClick} loading={false}>
  Submit Report
</Button>
```

### Input
```jsx
import Input from '../components/ui/Input';

<Input 
  label="Complaint Title" 
  error="Title is required" 
  required 
/>
```

### Card
```jsx
import Card from '../components/ui/Card';

<Card variant="elevated" interactive onClick={() => navigate('/detail')}>
  <h3>Card Title</h3>
  <p>Content goes here.</p>
</Card>
```

### Modal
```jsx
import Modal from '../components/ui/Modal';

<Modal 
  isOpen={isModalOpen} 
  onClose={() => setIsModalOpen(false)} 
  title="Verify Complaint"
>
  <p>Are you sure you want to verify this issue?</p>
</Modal>
```

### Badge
```jsx
import Badge from '../components/ui/Badge';

<Badge variant="warning" isPill>Pending Review</Badge>
```

### Alert
```jsx
import Alert from '../components/ui/Alert';

<Alert variant="error" title="Submission Failed" dismissible>
  Please check the highlighted fields and try again.
</Alert>
```

### Table
```jsx
import Table from '../components/ui/Table';

const columns = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Status', key: 'status' }
];

<Table columns={columns} data={complaintsData} sortable />
```

## Styling Guidelines

1. **Colors**: Always use CSS variables for colors (e.g., `bg-[var(--bg-secondary)]`, `text-[var(--text-primary)]`) to ensure dark mode compatibility.
2. **Spacing**: Rely on Tailwind's default spacing scale which corresponds to our 4px base unit.
3. **Typography**: Use classes like `text-[1.125rem]` or base typography classes (e.g., `body-large`, `body-small`) defined in `global.css`.
4. **Interactions**: Use the custom `focus-ring` utility class instead of default outlines to maintain consistent accessibility markers.

## Theming Guide

To toggle themes programmatically:

```jsx
import { useTheme } from '../context/ThemeContext';

const { theme, toggleTheme } = useTheme();

<button onClick={toggleTheme}>
  Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
</button>
```

## Animation Patterns

All major components use GSAP internally for hardware-accelerated animations (e.g., button presses, card hovers). For custom page transitions or scroll triggers, refer to `gsap.from` and `gsap.to` within `useEffect` blocks. Easing is generally set to `ease-out` or `power3.out`.

By strictly adhering to this Design System, SmartCivic will maintain a cohesive, stunning, and highly functional interface across all user touchpoints.
