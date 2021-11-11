import React from "react"
import { useStaticQuery, graphql, Link } from "gatsby"
import * as styles from "./index.module.css"
import Header from "../Header"
import PostItem from "./PostItem"
import Footer from "../Footer"

interface IIndexData {
  allMdx: {
    edges: {
      node: {
        frontmatter: {
          title: string
          date: string
          tags: string[]
        }
        excerpt: string
        slug: string
      }
    }[]
  }
}

interface BlogPostProps {
  pageContext: {
    next: object
    previous: object
  }
  data: IIndexData
}

const Index = ({ pageContext }: BlogPostProps) => {
  const data = useStaticQuery<IIndexData>(query)
  const { allMdx } = data
  const { edges: posts } = allMdx
  const { node: latestPost } = posts[0]
  const { frontmatter, excerpt, slug } = latestPost
  const { title, date, tags } = frontmatter

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.body}>
        <div className={styles.latest}>
          <div className={styles.meta}>
            <div className={styles.date}>{date}</div>
            <h1>
              <Link to={slug}>{title}</Link>
            </h1>
            {tags && <div className={styles.tags}>{tags.join(", ")}</div>}
          </div>
          <div className={styles.excerpt}>{excerpt}</div>
        </div>
        <div className={styles.divShort}></div>
        <div>
          {posts.map((post, index) => {
            if (index > 0) {
              return <PostItem post={post} />
            }
          })}
        </div>
      </div>
      <Footer />
    </div>
  )
}

export const query = graphql`
  query {
    allMdx(sort: { fields: frontmatter___date, order: DESC }) {
      edges {
        node {
          frontmatter {
            title
            date(formatString: "MMMM DD, YYYY")
            tags
          }
          excerpt
          slug
        }
      }
    }
  }
`
export default Index
