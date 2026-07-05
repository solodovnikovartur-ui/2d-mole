<script setup lang="ts">
import { computed } from "vue";
import type { GameState } from "../game/Game";

const props = defineProps<{
  state: GameState;
}>();

function shopStyle(col: number, row: number) {
  const { cellSize, worldOffset } = props.state;
  const half = cellSize / 2;
  return {
    width: `${cellSize}px`,
    height: `${half}px`,
    transform: `translate(${worldOffset.x + col * cellSize}px, ${worldOffset.y + row * cellSize + half}px)`,
  };
}

function deepShopCellStyle(col: number, row: number) {
  const { cellSize, worldOffset } = props.state;
  return {
    width: `${cellSize}px`,
    height: `${cellSize}px`,
    transform: `translate(${worldOffset.x + col * cellSize}px, ${worldOffset.y + row * cellSize}px)`,
  };
}

const ladderShopStyle = computed(() =>
  shopStyle(props.state.shops.ladder.x, props.state.shops.ladder.y),
);

const pickaxeShopStyle = computed(() =>
  shopStyle(props.state.shops.pickaxe.x, props.state.shops.pickaxe.y),
);

const deepShopStyle = computed(() => {
  const shop = props.state.shops.deepPickaxe;
  if (!shop) return null;
  if (props.state.blocks[shop.y][shop.x] !== 0) return null;
  return deepShopCellStyle(shop.x, shop.y);
});
</script>

<template>
  <div class="shop shop--ladder" :style="ladderShopStyle" title="Магазин лестниц">
    <span class="shop__icon">🪜</span>
    <span class="shop__label">Лестницы</span>
  </div>

  <div class="shop shop--pickaxe" :style="pickaxeShopStyle" title="Магазин кирок">
    <span class="shop__icon">⛏️</span>
    <span class="shop__label">Кирки</span>
  </div>

  <div
    v-if="deepShopStyle && state.shops.deepPickaxe"
    class="shop shop--deep"
    :style="deepShopStyle"
    title="Магазин кирок 3 уровня"
  >
    <span class="shop__icon">⛏️</span>
    <span class="shop__label">3 ур.</span>
  </div>
</template>
