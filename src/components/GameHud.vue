<script setup lang="ts">
import {
  LADDER_PACK_COST,
  LADDER_PACK_SIZE,
  pickaxeLabel,
  PICKAXE_HARD_COST,
  PICKAXE_NORMAL_COST,
  PICKAXE3_HARD_COST,
  PICKAXE3_NORMAL_COST,
} from "../game/grid";
import type { GameState } from "../game/Game";

defineProps<{
  state: GameState;
}>();

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
</script>

<template>
  <div class="hud">
    <div class="hud__top">
      <div class="hud__panel">
        <span class="hud__label">Время</span>
        <span class="hud__value">{{ formatTime(state.elapsed) }}</span>
      </div>
      <div class="hud__panel">
        <span class="hud__label">Обычные</span>
        <span class="hud__value">{{ state.currency.normal }}</span>
      </div>
      <div class="hud__panel">
        <span class="hud__label">Прочные</span>
        <span class="hud__value hud__value--hard">{{ state.currency.hard }}</span>
      </div>
      <div class="hud__panel">
        <span class="hud__label">Лестницы</span>
        <span class="hud__value">{{ state.ladderCount }}</span>
      </div>
      <div class="hud__panel">
        <span class="hud__label">Кирка</span>
        <span class="hud__value">
          {{ pickaxeLabel(state.pickaxeLevel, state.hasPiercePickaxe, state.hasSideBreak) }}
        </span>
      </div>
    </div>

    <div v-if="state.discoveredCodes.length > 0" class="hud__codes">
      <span class="hud__label">Найденные коды</span>
      <span v-for="code in state.discoveredCodes" :key="code" class="hud__code">{{ code }}</span>
    </div>

    <div v-if="state.codeMessage" class="hud__message">
      {{ state.codeMessage }}
    </div>

    <div v-if="state.usingComputer" class="hud__shop-panel hud__shop-panel--computer">
      <strong>Компьютер</strong>
      <p>Введи код из 6 букв и нажми Enter</p>
      <p class="hud__code-input">
        {{ state.codeInput || "______" }}
      </p>
      <p class="hud__shop-hint">
        Буквы как на QWERTY · ESC — выйти
      </p>
    </div>

    <div v-else-if="state.atComputer" class="hud__shop-panel hud__shop-panel--computer">
      <strong>Компьютер</strong>
      <p>Нажми E чтобы ввести код</p>
    </div>

    <div v-else-if="state.atLadderShop" class="hud__shop-panel">
      <strong>Магазин лестниц</strong>
      <p>{{ LADDER_PACK_SIZE }} лестниц за {{ LADDER_PACK_COST }} обычных блоков</p>
      <p class="hud__shop-key">Нажми F чтобы купить</p>
    </div>

    <div v-else-if="state.atPickaxeShop" class="hud__shop-panel">
      <strong>Магазин кирок</strong>
      <p v-if="state.pickaxeLevel >= 1">Улучшенная кирка уже куплена</p>
      <template v-else>
        <p>
          Улучшенная кирка: {{ PICKAXE_HARD_COST }} прочных +
          {{ PICKAXE_NORMAL_COST }} обычных блоков
        </p>
        <p class="hud__shop-hint">Прочные блоки — за 1 удар</p>
        <p class="hud__shop-key">Нажми F чтобы купить</p>
      </template>
    </div>

    <div v-else-if="state.atDeepPickaxeShop" class="hud__shop-panel">
      <strong>Магазин кирок (под землёй)</strong>
      <p v-if="state.pickaxeLevel < 1">Сначала купи улучшенную кирку на поверхности</p>
      <p v-else-if="state.pickaxeLevel >= 2">Кирка 3 уровня уже куплена</p>
      <template v-else>
        <p>
          Кирка 3 уровня: {{ PICKAXE3_HARD_COST }} прочных +
          {{ PICKAXE3_NORMAL_COST }} обычных блоков
        </p>
        <p class="hud__shop-hint">Железо ломается за 1 удар</p>
        <p class="hud__shop-key">Нажми F чтобы купить</p>
      </template>
    </div>

    <p v-else class="hud__hint">
      Стрелки / WASD — движение · Space — лестница · Копай вправо к железным землям
    </p>
  </div>
</template>
