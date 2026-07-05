<script setup lang="ts">
import type { BlockCell } from "../game/grid";
import { isCellLit } from "../game/grid";
import type { GameState } from "../game/Game";

defineProps<{
  state: GameState;
}>();

function cellClass(
  block: BlockCell,
  rowIndex: number,
  colIndex: number,
  state: GameState,
): string {
  if (state.ropes[rowIndex]?.[colIndex]) return "cell--rope";
  if (state.ladders[rowIndex]?.[colIndex]) return "cell--ladder";
  if (rowIndex < state.surfaceRows && rowIndex < (state.deepRegionStart ?? Infinity)) {
    return colIndex >= state.ironRegionStart ? "cell--sky-iron" : "cell--sky";
  }
  if (state.deepRegionStart != null && rowIndex >= state.deepRegionStart) {
    const localRow = rowIndex - state.deepRegionStart;
    if (localRow < (state.deepSurfaceRows ?? 0)) return "cell--sky-deep";
  }
  if (block === 7) return "cell--diamond";
  if (block === 8) return "cell--diamond-damaged";
  if (block === 9) return "cell--diamond-cracked";
  if (block === 10) return "cell--diamond-broken";
  if (block === 4) return "cell--iron";
  if (block === 5) return "cell--iron-damaged";
  if (block === 6) return "cell--iron-cracked";
  if (block === 2) return "cell--hard";
  if (block === 3) return "cell--hard-damaged";
  if (block === 1) {
    if (
      state.deepRegionStart != null &&
      rowIndex >= state.deepRegionStart &&
      rowIndex - state.deepRegionStart >= (state.deepSurfaceRows ?? 0)
    ) {
      return "cell--deep-soil";
    }
    return "cell--solid";
  }
  return "cell--empty";
}

function isDark(rowIndex: number, colIndex: number, state: GameState): boolean {
  if (state.deepRegionStart == null || rowIndex < state.deepRegionStart) return false;
  return !isCellLit(
    colIndex,
    rowIndex,
    state.mole.col,
    state.mole.row,
    state.deepRegionStart,
    state.deepSurfaceRows ?? 0,
    state.surfaceRows,
    state.hasLamp,
  );
}
</script>

<template>
  <div
    class="grid"
    :style="{
      left: `${state.worldOffset.x}px`,
      top: `${state.worldOffset.y}px`,
      width: `${state.cols * state.cellSize}px`,
      height: `${state.rows * state.cellSize}px`,
      gridTemplateColumns: `repeat(${state.cols}, ${state.cellSize}px)`,
      gridTemplateRows: `repeat(${state.rows}, ${state.cellSize}px)`,
    }"
  >
    <template v-for="(row, rowIndex) in state.blocks" :key="`row-${rowIndex}`">
      <div
        v-for="(block, colIndex) in row"
        :key="`cell-${rowIndex}-${colIndex}`"
        class="cell"
        :class="[
          cellClass(block, rowIndex, colIndex, state),
          { 'cell--dark': isDark(rowIndex, colIndex, state) },
        ]"
      />
    </template>
  </div>
</template>
