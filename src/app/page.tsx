import React from "react";
import styles from "./page.module.css";
import MainPage from "./main/page";
import { Viewer } from "resium";

export default function Home() {
  return (
    <main>
      <a
        className={styles['source-link']}
        href='https://github.com/hyundotio/nextjs-ts-cesium-example'
        target='_blank'
        rel='noreferrer noopener'
      >
        Helio Maps
      </a>
      <MainPage />
    </main>
  );
}
