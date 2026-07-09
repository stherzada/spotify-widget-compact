import { Suspense } from "react";
import ConfigForm from "@/components/ConfigForm";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <Suspense fallback={null}>
        <ConfigForm />
      </Suspense>
    </main>
  );
}
