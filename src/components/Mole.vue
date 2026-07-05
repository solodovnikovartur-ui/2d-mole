<script setup lang="ts">
import { computed } from "vue";
import type { GameState } from "../game/Game";

const props = defineProps<{
  state: GameState;
}>();

const style = computed(() => {
  const { mole, cellSize, worldOffset } = props.state;
  return {
    width: `${cellSize}px`,
    height: `${cellSize}px`,
    transform: `translate(${worldOffset.x + mole.col * cellSize}px, ${worldOffset.y + mole.row * cellSize}px)`,
  };
});
</script>

<template>
  <div class="mole" :class="`mole--facing-${state.mole.facing}`" :style="style">
    <div class="mole__body" />
    <div class="mole__nose" />
    <div class="mole__eye mole__eye--left" />
    <div class="mole__eye mole__eye--right" />
  </div>
</template>
