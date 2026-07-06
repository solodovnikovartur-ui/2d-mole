<script setup lang="ts">
import { computed } from "vue";
import { chebyshevDist } from "../game/grid";
import type { GameState } from "../game/Game";

const props = defineProps<{
  state: GameState;
}>();

const visibleInscriptions = computed(() => {
  const { mole, buriedCodeInscriptions = [], atComputer, usingComputer } = props.state;
  if (atComputer || usingComputer) return [];
  return buriedCodeInscriptions.filter(
    (entry) => chebyshevDist({ x: entry.col, y: entry.row }, { x: mole.col, y: mole.row }) <= 1,
  );
});

function inscriptionStyle(col: number, row: number) {
  const { cellSize, worldOffset } = props.state;
  return {
    width: `${cellSize}px`,
    height: `${cellSize}px`,
    transform: `translate(${worldOffset.x + col * cellSize}px, ${worldOffset.y + row * cellSize}px)`,
  };
}
</script>

<template>
  <div
    v-for="entry in visibleInscriptions"
    :key="`${entry.col},${entry.row}`"
    class="code-inscription"
    :style="inscriptionStyle(entry.col, entry.row)"
  >
    <span class="code-inscription__text">{{ entry.code }}</span>
  </div>
</template>
