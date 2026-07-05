<script setup lang="ts">
import { computed } from "vue";
import type { GameState } from "../game/Game";

const props = defineProps<{
  state: GameState;
}>();

const visible = computed(() => {
  const { mole, deepMole } = props.state;
  return mole.col !== deepMole.x || mole.row !== deepMole.y;
});

const style = computed(() => {
  const { deepMole, cellSize, worldOffset } = props.state;
  return {
    width: `${cellSize}px`,
    height: `${cellSize}px`,
    transform: `translate(${worldOffset.x + deepMole.x * cellSize}px, ${worldOffset.y + deepMole.y * cellSize}px)`,
  };
});
</script>

<template>
  <div v-if="visible" class="mole mole--deep mole--facing-down" :style="style">
    <div class="mole__body" />
    <div class="mole__nose" />
    <div class="mole__eye mole__eye--left" />
    <div class="mole__eye mole__eye--right" />
  </div>
</template>
