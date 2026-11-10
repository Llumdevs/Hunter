import type { ReactNode } from "react";
import { SideMenu } from "./side-menu";
import { TabBar } from "./tab-bar";

export function AppShell({ children }: { children: ReactNode }) {
  return <><SideMenu />{children}<TabBar /></>;
}
