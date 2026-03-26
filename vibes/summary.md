## Project Summary: Captain of Industry Resource Calculator

### Goal

Build a modern JavaScript web application that calculates resource requirements and production chains for *Captain of Industry*.

The app should allow users to:

* Select a resource
* Define a target production rate
* View all required inputs recursively
* See net production (surplus/deficit)

---

## Core Concept

This is **not just a calculator** — it is a:

> **Dependency graph engine with a UI on top**

The system must:

* Resolve resource dependencies recursively
* Aggregate total required inputs
* Compare against user-defined production

---

## Architecture Overview

### Folder Structure

```
assets/js/
  app/            # State + persistence
  data/           # Static resource definitions
  calculator/     # Core logic (pure functions)
  formatters/     # Output transformation
  ui/             # DOM interaction
```

---

## Key Systems

### 1. Data Layer

* Defines all resources and their recipes
* Supports multiple recipes per resource
* Uses a consistent unit (per minute)

Example:

```js
resource: {
  recipes: [
    {
      output: 60,
      inputs: { iron: 120 }
    }
  ]
}
```

---

### 2. Resolver (Core Engine)

* Recursively calculates all dependencies
* Input: resource + target rate
* Output:

  * Flat totals (aggregated resources)
  * Tree structure (dependency graph)

---

### 3. Calculator Service

* Entry point for calculations
* Uses resolver internally
* Returns structured results

---

### 4. Net Flow Calculation

* Compares:

  * Required resources
  * User production
* Outputs surplus/deficit per resource

---

### 5. State Management

Tracks:

* Selected resource
* Target production rate
* User-defined production overrides

---

### 6. Persistence

* Stored in localStorage
* Includes versioning
* Saves full user state

---

### 7. Formatters

* Convert raw calculation data into UI-friendly formats
* Examples:

  * Tree view
  * Flat totals

---

### 8. UI Layer

* Handles DOM interaction only
* Must not contain business logic

---

## Technical Rules

### JavaScript

* Use modern ES standards (ES modules, clean syntax)
* Small, focused files
* Single responsibility per file
* Clearly commented

### CSS

* Stored in `assets/css/styles.css`
* Clearly separated sections
* Use modern best practices (variables, responsive design)

---

## Development Approach

Build incrementally in this order:

1. Resource data structure
2. Dependency resolver (most important)
3. Calculator service
4. Net flow logic
5. Persistence
6. UI layer

---

## Key Constraints

* No mixing of logic and UI
* No large monolithic files
* No hardcoding single recipes
* All logic must be modular and extensible

---

## Future Extensibility

The system should support:

* Multiple recipes per resource
* Efficiency modifiers
* Expanded production chains

---

## Summary

The application should be:

* Modular
* Scalable
* Easy to extend
* Built with clear separation of concerns

Focus on building a **robust calculation engine first**, then layer UI on top.
