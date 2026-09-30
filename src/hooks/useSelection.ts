import { useReducer } from 'react';
import { selectionReducer, type Selection } from '../lib/selection';

export function useSelection(initial: Selection | null = null) {
  return useReducer(selectionReducer, initial);
}
