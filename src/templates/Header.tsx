import React from "react"
import { Link } from "gatsby"
import * as styles from "./Header.module.css"

const Header = () => {
  return (
    <div className={styles.header}>
      <Link className={styles.logoContainer} to="/">
        <div className={styles.randomShapeA}></div>
        <div className={styles.randomShapeB}></div>
      </Link>
    </div>
  )
}

export default Header
