import { useEffect, useState } from "react";
import type { Map2048, Direction, MoveResult } from "./types/statetypes.ts";

const defaultMap: Map2048 = [
  [null, null, null, null],
  [null, null, null, null],
  [null, null, null, null],
  [null, null, null, null]
];

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

const rotateDegreeMap: Record<Direction, 0 | 90 | 180 | 270> = {
  up: 90,
  right: 180,
  down: 270,
  left: 0
};
const revertDegreeMap: Record<Direction, 0 | 90 | 180 | 270> = {
  up: 270,
  right: 180,
  down: 90,
  left: 0
};

function validateMapIsNByM(map: Map2048) {
  const firstColumnCount = map[0].length;
  return map.every((row) => row.length === firstColumnCount);
}

function rotateMapCounterClockwise(map: Map2048, degree: 0 | 90 | 180 | 270): Map2048 {
  const rowLength = map.length;
  const columnLength = map[0].length;
  switch (degree) {
    case 0:
      return map;
    case 90:
      return Array.from({ length: columnLength }, (_, columnIndex) =>
        Array.from(
          { length: rowLength },
          (_, rowIndex) => map[rowIndex][columnLength - columnIndex - 1]
        ),
      );
    case 180:
      return Array.from({ length: rowLength }, (_, rowIndex) =>
        Array.from(
          { length: columnLength },
          (_, columnIndex) =>
            map[rowLength - rowIndex - 1][columnLength - columnIndex - 1],
        ),
      );
    case 270:
      return Array.from({ length: columnLength }, (_, columnIndex) =>
        Array.from(
          { length: rowLength },
          (_, rowIndex) => map[rowLength - rowIndex - 1][columnIndex],
        ),
      );
  }
}

function moveRowLeft(row: (number | null)[]): { result: (number | null)[]; isMoved: boolean } {
  const reduced = row.reduce(
    (acc: { lastCell: number | null; result: (number | null)[] }, cell) => {
      if (cell === null) return acc;
      if (acc.lastCell === null) return { ...acc, lastCell: cell };
      if (acc.lastCell === cell) return { result: [...acc.result, cell * 2], lastCell: null };
      return { result: [...acc.result, acc.lastCell], lastCell: cell };
    },
    { lastCell: null, result: [] }
  );
  const result = [...reduced.result];
  if (reduced.lastCell !== null) result.push(reduced.lastCell);
  const resultRow = Array(row.length).fill(null).map((_, i) => result[i] ?? null);
  return {
    result: resultRow,
    isMoved: row.some((cell, i) => cell !== resultRow[i])
  };
}

function moveLeft(map: Map2048): MoveResult {
  const movedRows = map.map(moveRowLeft);
  const result = movedRows.map((movedRow) => movedRow.result);
  const isMoved = movedRows.some((movedRow) => movedRow.isMoved);
  return { result, isMoved };
}

function moveMapIn2048Rule(map: Map2048, direction: Direction): MoveResult {
  if (!validateMapIsNByM(map)) throw new Error("Map is not N by M");
  const rotatedMap = rotateMapCounterClockwise(map, rotateDegreeMap[direction]);
  const { result, isMoved } = moveLeft(rotatedMap);
  return {
    result: rotateMapCounterClockwise(result, revertDegreeMap[direction]),
    isMoved,
  };
}

function addRandomTile(map: Map2048) {
  const empty: [number, number][] = [];
  map.forEach((row, i) =>
    row.forEach((cell, j) => {
      if (cell === null) empty.push([i, j]);
    })
  );
  if (empty.length === 0) return map;
  const [i, j] = empty[getRandomInt(empty.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  const newMap = map.map((row, r) => row.map((cell, c) => {
    if (r === i && c === j) return value;
    return cell;
  }));
  return newMap;
}

function checkGameOver(map: Map2048) {
  return map.flat().includes(128);
}

function App() {
  const [map, setMap] = useState<Map2048>(() =>
  addRandomTile(addRandomTile(defaultMap.map(row => [...row])))
);
  const [undoHistory, setUndoHistory] = useState<Map2048[]>([]);
  const isGameOver = checkGameOver(map);

  // 키보드 방향키 핸들링
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"].includes(e.key)) return;
      if (isGameOver) return;
      const dirMap: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right"
      };
      const { result, isMoved } = moveMapIn2048Rule(map, dirMap[e.key]);
      if (isMoved) {
        setUndoHistory((h) => [...h, map]);
        setMap(addRandomTile(result));
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [map, isGameOver]);

  // Undo 기능
  const handleUndo = () => {
    if (undoHistory.length === 0) return;
    setMap(undoHistory[undoHistory.length - 1]);
    setUndoHistory((h) => h.slice(0, -1));
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Mini 2048 Game</h2>
      {
        isGameOver
          ? <h3>게임 종료! 128 타일 생성됨</h3>
          : <p>방향키로 이동, UNDO로 이전 상태 복구!</p>
      }
      <button onClick={handleUndo} disabled={undoHistory.length === 0} style={{ marginBottom: "10px" }}>
        Undo
      </button>
      <div style={{ display: "grid", gridTemplateRows: "repeat(4, 60px)", gridTemplateColumns: "repeat(4, 60px)", gap: "5px" }}>
        {map.map((row, i) =>
          row.map((cell, j) => (
            <div key={i + "-" + j}
              style={{
                width: "60px", height: "60px",
                background: cell === null ? "#eee" : "#f7ca88",
                color: "#222", display: "flex", justifyContent: "center", alignItems: "center",
                fontSize: "22px", fontWeight: "bold", borderRadius: "3px"
              }}>
              {cell ?? ""}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
