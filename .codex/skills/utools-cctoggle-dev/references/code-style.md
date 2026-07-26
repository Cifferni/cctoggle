# Code Style Guide

## JavaScript/Vue

### General Rules
- Use ES modules (import/export)
- Prefer const over let (never use var)
- Use arrow functions for callbacks
- Use template literals for string concatenation

### Vue Components
- Use <script setup> syntax
- Define props with defineProps()
- Define emits with defineEmits()

## CSS

### Naming Convention
- Use BEM-like naming: .block__element--modifier
- Use kebab-case for class names

### Variables
:root {
 --bg: #ffffff;
 --text: #0f172a;
 --primary: #3b82f6;
}

.dark {
 --bg: #0f0f1a;
 --text: #f1f5f9;
}

## File Naming
- Components: PascalCase (ProviderCard.vue)
- Composables: camelCase (useProviders.js)
- Views: PascalCase with Page suffix
