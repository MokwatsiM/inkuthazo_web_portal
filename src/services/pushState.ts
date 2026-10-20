/** Pure push-state logic; kept free of Firebase imports so it is unit-testable. */
export type PushState =
  /** Browser can't do web push at all */
  | "unsupported"
  /** iPhone/iPad: push only works once added to the Home Screen */
  | "needs-install"
  /** Member denied the browser permission prompt */
  | "blocked"
  | "off"
  | "on";

/** Pure decision used by the profile toggle; kept separate so it is testable. */
export const resolvePushState = (input: {
  hasApis: boolean;
  ios: boolean;
  standalone: boolean;
  permission: NotificationPermission | "none";
  preference: boolean | undefined;
}): PushState => {
  if (input.ios && !input.standalone) return "needs-install";
  if (!input.hasApis) return "unsupported";
  if (input.permission === "denied") return "blocked";
  if (input.permission === "granted" && input.preference === true) return "on";
  return "off";
};

