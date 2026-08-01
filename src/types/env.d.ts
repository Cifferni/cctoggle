/// <reference types="vite/client" />
/// <reference types="utools-api-types" />

export {}

// @vicons/ionicons5 缺少类型声明
declare module '@vicons/ionicons5' {
  import type { Component } from 'vue'
  export const AddOutline: Component
  export const ArrowBackOutline: Component
  export const ArrowDownOutline: Component
  export const ArrowForwardOutline: Component
  export const ArrowUpOutline: Component
  export const BookmarkOutline: Component
  export const BuildOutline: Component
  export const ChatbubblesOutline: Component
  export const CheckmarkCircleOutline: Component
  export const CloseCircleOutline: Component
  export const CloseOutline: Component
  export const CloudDownloadOutline: Component
  export const CloudUploadOutline: Component
  export const CodeSlashOutline: Component
  export const CopyOutline: Component
  export const CreateOutline: Component
  export const CubeOutline: Component
  export const DesktopOutline: Component
  export const DocumentTextOutline: Component
  export const EllipsisHorizontalOutline: Component
  export const EllipsisVerticalOutline: Component
  export const FolderOpenOutline: Component
  export const FolderOutline: Component
  export const GitBranchOutline: Component
  export const GlobeOutline: Component
  export const InformationCircleOutline: Component
  export const KeyOutline: Component
  export const LayersOutline: Component
  export const LinkOutline: Component
  export const ListOutline: Component
  export const LogInOutline: Component
  export const LogOutOutline: Component
  export const MoonOutline: Component
  export const NotificationsOutline: Component
  export const OptionsOutline: Component
  export const PeopleOutline: Component
  export const PersonOutline: Component
  export const PlayOutline: Component
  export const PowerOutline: Component
  export const RefreshOutline: Component
  export const ReloadOutline: Component
  export const RemoveOutline: Component
  export const RocketOutline: Component
  export const SaveOutline: Component
  export const SearchOutline: Component
  export const SettingsOutline: Component
  export const ShareOutline: Component
  export const StatsChartOutline: Component
  export const StopOutline: Component
  export const SunnyOutline: Component
  export const SwapHorizontalOutline: Component
  export const SyncOutline: Component
  export const TerminalOutline: Component
  export const TextOutline: Component
  export const TimeOutline: Component
  export const TrashOutline: Component
  export const TrendingUpOutline: Component
  export const VideocamOutline: Component
  export const WalletOutline: Component
  export const WarningOutline: Component
}

// window 全局扩展
declare global {
  interface Window {
    utoolsCctoggle?: import('./utools-cctoggle').UtoolsCctoggle
  }
}
