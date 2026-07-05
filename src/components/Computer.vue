<script setup lang="ts">
import { computed } from "vue";
import type { GameState } from "../game/Game";

const props = defineProps<{
  state: GameState;
}>();

const style = computed(() => {
  const { computer, cellSize, worldOffset } = props.state;
  const half = cellSize / 2;
  return {
    width: `${cellSize}px`,
    height: `${half}px`,
    transform: `translate(${worldOffset.x + computer.x * cellSize}px, ${worldOffset.y + computer.y * cellSize + half}px)`,
  };
});
</script>

<template>
  <div class="computer" :style="style" title="Компьютер">
    <span class="computer__icon">💻</span>
    <span class="computer__label">ПК</span>
  </div>
</template>
