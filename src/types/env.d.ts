/// <reference types="vite/client" />
/// <reference types="utools-api-types" />

export {}

// window 全局扩展
declare global {
  interface Window {
    utoolsCctoggle?: import('./utools-cctoggle').UtoolsCctoggle
  }
}
