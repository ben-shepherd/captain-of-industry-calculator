## TODO: Captain of Industry Calculator

### Phase 1 — Foundation (Core Engine)

#### ✅ 1. Resource Data

* [ ] Create `assets/js/data/resources.js`
* [ ] Define initial dataset:

  * steel
  * iron
  * ore
* [ ] Ensure:

  * Supports multiple recipes
  * Uses consistent units (per minute)
* [ ] Export as ES module

---

#### ✅ 2. Resolver (Critical Logic)

* [ ] Create `assets/js/calculator/resolver.js`
* [ ] Implement recursive function:

  * `resolve(resourceId, amount)`
* [ ] Return:

  * Flat totals `{ resource: amount }`
  * Dependency tree structure
* [ ] Handle:

  * Resources with no inputs (base resources)
* [ ] Add recursion safety (prevent infinite loops)

---

#### ✅ 3. Calculator Service

* [ ] Create `assets/js/calculator/service.js`
* [ ] Implement:

  * `calculate(resourceId, targetRate)`
* [ ] Use resolver internally
* [ ] Return structured result:

  * totals
  * tree

---

#### ✅ 4. Net Flow Calculation

* [ ] Create `assets/js/calculator/net.js`
* [ ] Implement:

  * Compare required vs user production
* [ ] Output:

  * `{ resource: netValue }`
* [ ] Ensure:

  * Positive = surplus
  * Negative = deficit

---

### Phase 2 — State & Persistence

#### ✅ 5. App State

* [ ] Create `assets/js/app/state.js`
* [ ] Define state shape:

  * selectedResource
  * targetRate
  * userProduction map
* [ ] Add getters/setters (optional but recommended)

---

#### ✅ 6. Persistence (LocalStorage)

* [ ] Create `assets/js/app/persistence.js`
* [ ] Implement:

  * `saveState(state)`
  * `loadState()`
* [ ] Include:

  * Versioning
* [ ] Handle:

  * Missing/invalid data safely

---

### Phase 3 — Formatting Layer

#### ✅ 7. Flat Formatter

* [ ] Create `assets/js/formatters/flatFormatter.js`
* [ ] Convert totals into UI-friendly structure
* [ ] Sort or group if needed

---

#### ✅ 8. Tree Formatter

* [ ] Create `assets/js/formatters/treeFormatter.js`
* [ ] Format dependency tree for display
* [ ] Ensure nested structure is clean and readable

---

### Phase 4 — UI Layer (Minimal First)

#### ✅ 9. Basic UI Controller

* [ ] Create `assets/js/ui/controller.js`
* [ ] Connect:

  * Inputs → state
  * State → calculator
* [ ] Render:

  * Results to DOM

---

#### ✅ 10. Event Handling

* [ ] Create `assets/js/ui/events.js`
* [ ] Handle:

  * Resource selection
  * Target rate input
  * Production overrides

---

#### ✅ 11. Basic HTML Interface

* [ ] Add:

  * Resource selector (dropdown/search)
  * Input for target rate
  * Output display area

---

### Phase 5 — Styling

#### ✅ 12. CSS Structure

* [ ] Use `assets/css/styles.css`
* [ ] Add sections:

  * Layout
  * Inputs
  * Results
* [ ] Ensure:

  * Clear section comments
  * Responsive basics

---

### Phase 6 — Enhancements (After Core Works)

#### 🔲 13. Validation

* [ ] Prevent invalid inputs (negative numbers, empty values)
* [ ] Handle missing resources gracefully

---

#### 🔲 14. Overrides System

* [ ] Allow user to:

  * Manually set production per resource
* [ ] Integrate into net calculation

---

#### 🔲 15. Performance Improvements

* [ ] Add memoization to resolver
* [ ] Avoid unnecessary recalculations

---

#### 🔲 16. UX Improvements

* [ ] Highlight:

  * Bottlenecks (deficits)
  * Surpluses
* [ ] Improve readability of tree output

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
