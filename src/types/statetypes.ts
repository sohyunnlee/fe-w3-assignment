export type Cell = number | null;
export type Map2048 = Cell[][];
export type Direction = "up" | "left" | "right" | "down";
export type MoveResult = { result: Map2048; isMoved: boolean; };
