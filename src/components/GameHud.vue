<script setup lang="ts">

import {
  BOOST_COOLDOWN,
  BOOST_DURATION,
} from "../game/codes";
import {
  LADDER_PACK_COST,

  LADDER_PACK_SIZE,

  LAMP_COST,
  LAMP_RADIUS,
  LAMP_RADIUS_BOOSTED,
  ROPE_COST,

  pickaxeLabel,

  PICKAXE_HARD_COST,

  PICKAXE_NORMAL_COST,

  PICKAXE3_HARD_COST,

  PICKAXE3_NORMAL_COST,

  PICKAXE4_DIAMOND_COST,

  PICKAXE4_IRON_COST,

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

        <span class="hud__label">Железо</span>

        <span class="hud__value hud__value--iron">{{ state.currency.iron }}</span>

      </div>

      <div class="hud__panel">

        <span class="hud__label">Алмазы</span>

        <span class="hud__value hud__value--diamond">{{ state.currency.diamond }}</span>

      </div>

      <div class="hud__panel">

        <span class="hud__label">Лестницы</span>

        <span class="hud__value">{{ state.ladderCount }}</span>

      </div>

      <div class="hud__panel">

        <span class="hud__label">Верёвки</span>

        <span class="hud__value">{{ state.ropeCount }}</span>

      </div>

      <div v-if="state.boostUnlocked" class="hud__panel hud__panel--boost">
        <span class="hud__label">Буст</span>
        <span v-if="state.boostActive" class="hud__value hud__value--boost">
          {{ Math.ceil(state.boostTimeLeft) }}с
        </span>
        <span v-else-if="state.boostCooldownLeft > 0" class="hud__value hud__value--cooldown">
          ↻ {{ Math.ceil(state.boostCooldownLeft) }}с
        </span>
        <span v-else class="hud__value hud__value--boost-ready">B</span>
      </div>

      <div class="hud__panel">

        <span class="hud__label">Кирка</span>

        <span class="hud__value">

          {{ pickaxeLabel(state.pickaxeLevel, state.hasPiercePickaxe, state.hasSideBreak) }}

        </span>

      </div>

    </div>



    <div
      v-if="state.codeMessage && !state.atComputer && !state.usingComputer"
      class="hud__message"
    >
      {{ state.codeMessage }}
    </div>

    <div
      v-if="state.atComputer || state.usingComputer"
      class="hud__shop-panel hud__shop-panel--computer"
    >
      <strong>📖 Книжка</strong>

      <p v-if="!state.bookEntries?.length" class="hud__book-empty">Пока пусто — ищи коды в земле</p>

      <ul v-else class="hud__book-list">
        <li v-for="entry in state.bookEntries" :key="entry.code" class="hud__book-item">
          <span class="hud__book-code">{{ entry.code }}</span>
          <span class="hud__book-label">{{ entry.label }}</span>
        </li>
      </ul>

      <template v-if="state.usingComputer">
        <p>Введи код из 6 букв и нажми Enter</p>
        <p class="hud__code-input">
          {{ state.codeInput || "______" }}
        </p>
        <p v-if="state.codeMessage" class="hud__book-feedback">{{ state.codeMessage }}</p>
        <p class="hud__shop-hint">Буквы как на QWERTY · ESC — выйти</p>
      </template>

      <p v-else class="hud__shop-key">Нажми E чтобы ввести код</p>
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

      <strong>Магазин кирок (в железе)</strong>

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



    <div v-else-if="state.atLampShop" class="hud__shop-panel">

      <strong>Магазин ламп</strong>

      <p v-if="state.hasLamp && state.hasExpandedLamp">Лампа куплена · радиус увеличен</p>

      <p v-else-if="state.hasLamp">Лампа уже куплена</p>

      <template v-else>

        <p>Лампа: {{ LAMP_COST }} прочных блоков</p>

        <p class="hud__shop-hint">
          Радиус {{ LAMP_RADIUS }} клеток
          <template v-if="state.hasExpandedLamp"> → {{ LAMP_RADIUS_BOOSTED }}</template>
          · код спрятан в алмазных землях
        </p>

        <p class="hud__shop-key">Нажми F чтобы купить</p>

      </template>

    </div>



    <div v-else-if="state.atRopeShop" class="hud__shop-panel">

      <strong>Магазин верёвок</strong>

      <p>Верёвка: {{ ROPE_COST }} железных блоков</p>

      <p class="hud__shop-hint">От твоей позиции до низа · подъём и спуск</p>

      <p class="hud__shop-key">F — купить · R — поставить в своей колонке</p>

    </div>



    <div v-else-if="state.atDeepPickaxe4Shop" class="hud__shop-panel">

      <strong>Магазин кирок (алмазные земли)</strong>

      <p v-if="state.pickaxeLevel < 2">Сначала купи кирку 3 уровня</p>

      <p v-else-if="state.pickaxeLevel >= 3">Кирка 4 уровня уже куплена</p>

      <template v-else>

        <p>

          Кирка 4 уровня: {{ PICKAXE4_DIAMOND_COST }} алмазных +

          {{ PICKAXE4_IRON_COST }} железных блоков

        </p>

        <p class="hud__shop-hint">Алмазы — 1 удар · код буста спрятан в алмазных землях</p>

        <p class="hud__shop-key">F — купить</p>

        <p v-if="state.boostUnlocked" class="hud__shop-hint">
          B — буст ({{ BOOST_DURATION }}с, перезарядка {{ BOOST_COOLDOWN }}с)
        </p>

      </template>

    </div>



    <p v-else-if="!state.atComputer && !state.usingComputer" class="hud__hint">

      Копай вниз по шахте · Справа — железо · Тёмные алмазные земли внизу

      <template v-if="state.ropeCount > 0"> · R — верёвка</template>
      <template v-if="state.boostUnlocked && !state.boostActive && state.boostCooldownLeft <= 0">
        · B — буст
      </template>

    </p>

  </div>

</template>

