## TODO: Captain of Industry Calculator

### Phase 1 — Foundation (Core Engine)

#### ✅ 1. Resource Data

* [x] Create `assets/js/data/resources.js`
* [x] Define initial dataset:

  * steel
  * iron
  * ore
* [x] Ensure:

  * Supports multiple recipes
  * Uses consistent units (per minute)
* [x] Export as ES module

---

#### ✅ 2. Resolver (Critical Logic)

* [x] Create `assets/js/calculator/resolver.js`
* [x] Implement recursive function:

  * `resolve(resourceId, amount)`
* [x] Return:

  * Flat totals `{ resource: amount }`
  * Dependency tree structure
* [x] Handle:

  * Resources with no inputs (base resources)
* [ ] Add recursion safety (prevent infinite loops)

---

#### ✅ 3. Calculator Service

* [x] Create `assets/js/calculator/service.js`
* [x] Implement:

  * `calculate(resourceId, targetRate)`
* [x] Use resolver internally
* [x] Return structured result:

  * totals
  * tree

---

#### ✅ 4. Net Flow Calculation

* [x] Create `assets/js/calculator/net.js`
* [x] Implement:

  * Compare required vs user production
* [x] Output:

  * `{ resource: netValue }`
* [x] Ensure:

  * Positive = surplus
  * Negative = deficit

---

### Phase 2 — State & Persistence

#### ✅ 5. App State

* [x] Create `assets/js/app/state.js`
* [x] Define state shape:

  * selectedResource
  * targetRate
  * userProduction map
* [x] Add getters/setters (optional but recommended)

---

#### ✅ 6. Persistence (LocalStorage)

* [x] Create `assets/js/app/persistence.js`
* [x] Implement:

  * `saveState(state)`
  * `loadState()`
* [x] Include:

  * Versioning
* [x] Handle:

  * Missing/invalid data safely

---

### Phase 3 — Formatting Layer

#### ✅ 7. Flat Formatter

* [x] Create `assets/js/formatters/flatFormatter.js`
* [x] Convert totals into UI-friendly structure
* [x] Sort or group if needed

---

#### ✅ 8. Tree Formatter

* [x] Create `assets/js/formatters/treeFormatter.js`
* [x] Format dependency tree for display
* [x] Ensure nested structure is clean and readable

---

### Phase 4 — UI Layer (Minimal First)

#### ✅ 9. Basic UI Controller

* [x] Create `assets/js/ui/controller.js`
* [x] Connect:

  * Inputs → state
  * State → calculator
* [x] Render:

  * Results to DOM

---

#### ✅ 10. Event Handling

* [x] Create `assets/js/ui/events.js`
* [x] Handle:

  * Resource selection
  * Target rate input
  * Production overrides

---

#### ✅ 11. Basic HTML Interface

* [x] Add:

  * Resource selector (dropdown/search)
  * Input for target rate
  * Output display area

---

### Phase 5 — Styling

#### ✅ 12. CSS Structure

* [x] Use `assets/css/styles.css`
* [x] Add sections:

  * Layout
  * Inputs
  * Results
* [x] Ensure:

  * Clear section comments
  * Responsive basics

---

### Phase 6 — Enhancements (After Core Works)

#### ✅ 13. Validation

* [x] Prevent invalid inputs (negative numbers, empty values)
* [x] Handle missing resources gracefully

---

#### ✅ 14. Overrides System

* [x] Allow user to:

  * Manually set production per resource
* [x] Integrate into net calculation

---

#### ✅ 15. Performance Improvements

* [x] Add memoization to resolver
* [x] Avoid unnecessary recalculations

---

#### ✅ 16. UX Improvements

* [x] Highlight:

  * Bottlenecks (deficits)
  * Surpluses
* [x] Improve readability of tree output

---

### Phase 7 — Future (Do NOT build yet)

* [ ] Multiple recipe selection
* [ ] Efficiency modifiers
* [ ] Save/load multiple scenarios
* [ ] Import/export configs

---

## Priority Rule

Always prioritize:

1. Resolver correctness
2. Clean architecture
3. Separation of concerns

Do NOT move to UI until the core engine is working correctly.
