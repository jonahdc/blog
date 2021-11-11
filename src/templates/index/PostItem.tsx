import React from "react"
import { Link } from "gatsby"
import * as styles from "./PostItem.module.css"

const PostItem = ({ post }) => {
  const { node } = post
  const { frontmatter, excerpt, slug } = node
  const { title, date, tags } = frontmatter

  return (
    <div className={styles.postItem}>
      <div className={styles.date}>{date}</div>
      <Link to={slug} className={`${styles.title} `}>
        {title}
      </Link>
      <div className="md:col-span-3">
        <div className={styles.excerpt}>{excerpt}</div>
        {tags && <div className={styles.tags}>{tags.join(", ")}</div>}
      </div>
    </div>
  )
}

export default PostItem
