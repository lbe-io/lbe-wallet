export const isActiveRecord = (dr: unknown) => String(dr ?? '0') === '0';
export const isSelectedToken = (selected: unknown) => String(selected ?? '0') === '1';
