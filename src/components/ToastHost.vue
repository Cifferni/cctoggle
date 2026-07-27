<script setup>
import { useToast } from "../composables/useToast.js";
const { toast, state } = useToast();
</script>

<template>
  <div class="toast-host">
    <TransitionGroup name="toast">
      <div
        v-for="t in state.items" :key="t.id"
        class="toast"
        :class="'toast--' + t.type"
        @click="toast.dismiss(t.id)"
      >
        <span class="toast__icon">
          <template v-if="t.type === 'success'">&#x2714;</template>
          <template v-else-if="t.type === 'warn'">&#x26A0;</template>
          <template v-else-if="t.type === 'error'">&#x2716;</template>
          <template v-else>&#x2139;</template>
        </span>
        <span class="toast__text">{{ t.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}
.toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  box-shadow: 0 4px 16px rgba(0,0,0,.18);
  cursor: pointer;
  max-width: 420px;
  transition: all .25s ease;
}
.toast--info    { background: #1e293b; color: #e2e8f0; border: 1px solid #334155; }
.toast--success { background: #065f46; color: #d1fae5; border: 1px solid #059669; }
.toast--warn    { background: #78350f; color: #fef3c7; border: 1px solid #d97706; }
.toast--error   { background: #7f1d1d; color: #fee2e2; border: 1px solid #dc2626; }
.toast__icon { font-size: 15px; flex-shrink: 0; }
.toast__text { white-space: pre-wrap; word-break: break-word; }

.toast-enter-active { animation: toast-in .25s ease; }
.toast-leave-active { animation: toast-out .2s ease; }
@keyframes toast-in  { from { opacity: 0; transform: translateY(-16px) scale(.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes toast-out { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(-16px) scale(.95); } }
</style>
