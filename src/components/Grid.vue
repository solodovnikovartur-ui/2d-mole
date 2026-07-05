<script setup lang="ts">
import type { BlockCell } from "../game/grid";
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
  if (state.ladders[rowIndex][colIndex]) return "cell--ladder";
  if (rowIndex < state.surfaceRows) {
    return colIndex >= state.ironRegionStart ? "cell--sky-iron" : "cell--sky";
  }
  if (block === 4) return "cell--iron";
  if (block === 5) return "cell--iron-damaged";
  if (block === 6) return "cell--iron-cracked";
  if (block === 2) return "cell--hard";
  if (block === 3) return "cell--hard-damaged";
  if (block === 1) return "cell--solid";
  return "cell--empty";
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
        :class="cellClass(block, rowIndex, colIndex, state)"
      />
    </template>
  </div>
</template>
