<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import Computer from "./components/Computer.vue";
import DeepMole from "./components/DeepMole.vue";
import GameHud from "./components/GameHud.vue";
import Grid from "./components/Grid.vue";
import Mole from "./components/Mole.vue";
import Shops from "./components/Shops.vue";
import { Game, type GameState } from "./game/Game";

const gameState = ref<GameState | null>(null);

let game: Game | null = null;

function focusGame(): void {
  (document.activeElement as HTMLElement | null)?.blur();
}

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
  <div class="game-shell" @pointerdown="focusGame">
    <div v-if="gameState" class="game-world">
      <Grid :state="gameState" />
      <Shops :state="gameState" />
      <Computer :state="gameState" />
      <Mole :state="gameState" />
      <DeepMole :state="gameState" />
      <GameHud :state="gameState" />
    </div>
  </div>
</template>
