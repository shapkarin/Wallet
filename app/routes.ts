import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("onboarding", "routes/onboarding.tsx"),
  route("setup", "routes/setup.tsx"),
  route("unlock", "routes/unlock.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("create-wallet", "routes/create-wallet.tsx"),
  route("create-wallet/backup-prompt", "routes/create-wallet.backup-prompt.tsx"),
  route("create-wallet/backup", "routes/create-wallet.backup.tsx"),
  route("import-wallet", "routes/import-wallet.tsx"),
  route("derive-wallet", "routes/derive-wallet.tsx"),
  route("derive-wallet/path-selection", "routes/derive-wallet.path-selection.tsx"),
  route("wallet/:id", "routes/wallet.$id.tsx"),
  route("wallet/:id/private-key", "routes/wallet.$id.private-key.tsx"),
  route("wallet/:id/mnemonic", "routes/wallet.$id.mnemonic.tsx"),
  route("settings", "routes/settings.tsx"),
  // route("*", "routes/$.tsx"), todo: 404 page
] satisfies RouteConfig;
