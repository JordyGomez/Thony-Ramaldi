import type { Metadata } from "next";
import styles from "./admin.module.css";

export const metadata: Metadata = {
  title: "Panel de propiedades",
  robots: { index: false, follow: false },
};

// El panel queda fuera del grupo (site): sin cabecera, pie ni introducción.
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className={styles.shell}>{children}</div>;
}
