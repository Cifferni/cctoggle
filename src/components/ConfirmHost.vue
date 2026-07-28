<script setup>
import { useConfirm } from "../composables/useConfirm.js";
const { confirm, state } = useConfirm();
</script>

<template>
  <Transition name="confirm">
    <div v-if="state.item" class="confirm-mask" @click.self="confirm.cancel()">
      <div class="confirm-box">
        <div class="confirm-title">{{ state.item.title }}</div>
        <div class="confirm-msg">{{ state.item.message }}</div>
        <div class="confirm-actions">
          <button class="confirm-btn confirm-btn--cancel" @click="confirm.cancel()">{{ state.item.cancelText }}</button>
          <button
            class="confirm-btn"
            :class="state.item.danger ? 'confirm-btn--danger' : 'confirm-btn--primary'"
            @click="confirm.accept()"
          >{{ state.item.confirmText }}</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.confirm-mask {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, .45);
}
.confirm-box {
  width: 300px;
  max-width: calc(100vw - 48px);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 18px 18px 14px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, .3);
}
.confirm-title { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
.confirm-msg { font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 18px; }
.confirm-actions { display: flex; justify-content: flex-end; gap: 8px; }
.confirm-btn { border: 1px solid var(--border); background: none; color: var(--text-secondary); padding: 6px 16px; border-radius: 7px; cursor: pointer; font-size: 13px; }
.confirm-btn--cancel:hover { background: var(--bg-hover); color: var(--text); }
.confirm-btn--primary { background: var(--primary); border-color: var(--primary); color: #fff; }
.confirm-btn--primary:hover { opacity: .9; }
.confirm-btn--danger { background: #ef4444; border-color: #ef4444; color: #fff; }
.confirm-btn--danger:hover { opacity: .9; }

.confirm-enter-active, .confirm-leave-active { transition: opacity .18s ease; }
.confirm-enter-from, .confirm-leave-to { opacity: 0; }
.confirm-enter-active .confirm-box { animation: confirm-in .2s ease; }
@keyframes confirm-in { from { transform: scale(.94); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>
