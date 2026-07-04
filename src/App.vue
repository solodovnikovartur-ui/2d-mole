<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import GameHud from "./components/GameHud.vue";
import { createInitialGameState, Game, type GameState } from "./game/Game";

const gameState = ref<GameState>(createInitialGameState());

let game: Game | null = null;

onMounted(() => {
  game = new Game((state) => {
    gameState.value = state;
  });
  game.start();
});

onUnmounted(() => {
  game?.stop();
});
</script>

<template>
  <div class="game-shell">
    <div class="game-world">
      <GameHud :state="gameState" />
    </div>
  </div>
</template>
