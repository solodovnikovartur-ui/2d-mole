<script setup lang="ts">
import { computed } from "vue";
import type { DeepShopPositions } from "../game/grid";
import type { GameState } from "../game/Game";

const props = defineProps<{
  state: GameState;
}>();

const EMPTY_DEEP_SHOPS: DeepShopPositions = {
  lamp: { x: 0, y: 0 },
  rope: { x: 0, y: 0 },
  pickaxe4: null,
};

const deepShops = computed(() => props.state.deepShops ?? EMPTY_DEEP_SHOPS);

function isCellEmpty(col: number, row: number): boolean {
  const rowData = props.state.blocks[row];
  if (!rowData) return false;
  return rowData[col] === 0;
}

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
  if (!isCellEmpty(shop.x, shop.y)) return null;
  return deepShopCellStyle(shop.x, shop.y);
});

const lampShopStyle = computed(() => {
  const shop = deepShops.value.lamp;
  return shopStyle(shop.x, shop.y);
});

const ropeShopStyle = computed(() => {
  const shop = deepShops.value.rope;
  return shopStyle(shop.x, shop.y);
});

const pickaxe4ShopStyle = computed(() => {
  const shop = deepShops.value.pickaxe4;
  if (!shop) return null;
  if (!isCellEmpty(shop.x, shop.y)) return null;
  return deepShopCellStyle(shop.x, shop.y);
});

const showDeepShops = computed(() => Boolean(props.state.deepShops));
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

  <template v-if="showDeepShops">
    <div class="shop shop--lamp" :style="lampShopStyle" title="Магазин ламп">
      <span class="shop__icon">💡</span>
      <span class="shop__label">Лампа</span>
    </div>

    <div class="shop shop--rope" :style="ropeShopStyle" title="Магазин верёвок">
      <span class="shop__icon">🪢</span>
      <span class="shop__label">Верёвка</span>
    </div>

    <div
      v-if="pickaxe4ShopStyle && deepShops.pickaxe4"
      class="shop shop--pickaxe4"
      :style="pickaxe4ShopStyle"
      title="Магазин кирок 4 уровня"
    >
      <span class="shop__icon">⛏️</span>
      <span class="shop__label">4 ур.</span>
    </div>
  </template>
</template>
