export type SheetSnap = 'peek' | 'full';

/** Bottom sheet heights as fractions of the dynamic viewport height. */
export const SHEET_HEIGHT: Record<SheetSnap, number> = { peek: 0.42, full: 0.86 };
