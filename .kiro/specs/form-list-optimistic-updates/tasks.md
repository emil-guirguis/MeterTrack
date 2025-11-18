# Implementation Plan

- [x] 1. Update Framework TypeScript Interfaces





  - Add `addItemToList` and `updateItemInList` to `EntityStore` interface in `framework/frontend/forms/types/form.ts`
  - Create `UpdateStrategy` type ('optimistic' | 'reload')
  - Add `updateStrategy` parameter to `EntityFormWithStoreConfig`
  - Mark `refreshAfterSave` as deprecated in JSDoc comments
  - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 5.4_


- [x] 2. Implement Optimistic Update Logic in Framework Hook




  - Update `framework/frontend/forms/hooks/useEntityFormWithStore.tsx`
  - Add `updateStrategy` parameter with default value 'optimistic'
  - Handle backward compatibility with `refreshAfterSave` parameter
  - After successful API call for create, check if `updateStrategy === 'optimistic'` and call `store.addItemToList(savedEntity)`
  - After successful API call for update, check if `updateStrategy === 'optimistic'` and call `store.updateItemInList(savedEntity)`
  - When `updateStrategy === 'reload'`, call `store.fetchItems()`
  - Validate saved entity has required properties (id) before optimistic update
  - Add try-catch for optimistic update with fallback to fetchItems
  - Check if store has optimistic methods before calling, fall back to fetchItems if missing
  - Add console warnings for fallback scenarios
  - Add deprecation warning if `refreshAfterSave` is explicitly set
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.1, 2.2, 2.3, 2.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_
- [x] 3. Add Optimistic Methods to Client Entity Store




- [ ] 3. Add Optimistic Methods to Client Entity Store

  - Update `client/frontend/src/store/slices/createEntitySlice.ts`
  - Add `addItemToList` method that wraps existing `addItem` functionality
  - Add `updateItemInList` method that replaces entire item by ID (not partial update)
  - Ensure `updateItemInList` preserves item position in array
  - Handle edge case where item is not found (add it as fallback)
  - Update `createEntityHook` to expose `addItemToList` and `updateItemInList` methods
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 8.1, 8.2, 8.3, 8.4_


- [x] 4. Test with Contact Module



- [x] 4.1 Verify contacts store has optimistic methods


  - Check that contacts store (created with `createEntityStore`) exposes `addItemToList` and `updateItemInList`
  - Manually test calling these methods from browser console
  - _Requirements: 3.1, 3.2, 3.5_

- [x] 4.2 Update ContactForm to use optimistic updates


  - Check if ContactForm currently uses `useEntityFormWithStore` or manual submission
  - If using manual submission, refactor to use `useEntityFormWithStore` from framework
  - Set `updateStrategy: 'optimistic'` explicitly
  - Test create operation - verify new contact appears in list immediately
  - Test update operation - verify contact changes appear in list immediately
  - Test error handling - verify list doesn't update on API failure
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.1, 2.2, 2.3, 2.5, 4.2_
