import * as React from "react"
import { MDXProvider } from "@mdx-js/react"
import { MDXRenderer } from "gatsby-plugin-mdx"
import { graphql, Link } from "gatsby"
import { defineCustomElements as deckDeckGoHighlightElement } from "@deckdeckgo/highlight-code/dist/loader"
import * as styles from "./Post.module.css"
import Footer from "./Footer"
import Header from "./Header"

interface IMdxNode {
  slug: string
  body: string
  path: string
  frontmatter: {
    title: string
    date: string
    tags: string[]
  }
}

interface PostProps {
  pageContext: {
    next: { slug: string; frontmatter: { title: string } }
    previous: { slug: string; frontmatter: { title: string } }
  }
  data: {
    mdx: IMdxNode
  }
}

const Post = ({ data, pageContext }: PostProps) => {
  const { mdx } = data
  const { frontmatter, body } = mdx
  const { title, date, tags } = frontmatter

  const { previous, next } = pageContext

  deckDeckGoHighlightElement()

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.body}>
        <div className={styles.date}>{date}</div>
        <h1 className={styles.title}>{title}</h1>
        {tags && <div className={styles.tags}>{tags.join(", ")}</div>}
        <div className={styles.post}>
          <MDXProvider>
            <MDXRenderer>{body}</MDXRenderer>
          </MDXProvider>
        </div>
        <div className={styles.divShort}></div>
      </div>
      <div className={styles.postFooter}>
        <div className={styles.subFooter}>
          <Link to="/">All Posts</Link>
          <div className={styles.divShortVertical}></div>
        </div>
        {previous && (
          <Link to={`/${previous.slug}`} className={styles.previous}>
            {previous.frontmatter.title}
          </Link>
        )}
        {next && (
          <Link to={`/${next.slug}`} className={styles.next}>
            {next.frontmatter.title}
          </Link>
        )}
      </div>
      <Footer />
    </div>
  )
}

export default Post

export const query = graphql`
  query ($slug: String!) {
    mdx(slug: { eq: $slug }) {
      slug
      body
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        tags
      }
    }
  }
`
