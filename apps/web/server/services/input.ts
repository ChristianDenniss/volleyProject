export type PartialInput<T> = { [K in keyof T]?: T[K] | undefined };
