/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/node-apis/
 */

// You can delete this file if you're not using it

const { createFilePath } = require(`gatsby-source-filesystem`)

exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions
  if (node.internal.type === `MarkdownRemark`) {
    const slug = createFilePath({ node, getNode, basePath: `pages` })
    createNodeField({
      node,
      name: `slug`,
      value: slug,
    })
  }
}

exports.createPages = async function ({ actions, graphql }) {
  const { data } = await graphql(`
    query {
      allMdx(sort: { order: DESC, fields: frontmatter___date }) {
        edges {
          node {
            slug
          }
          next {
            slug
            frontmatter {
              title
            }
          }
          previous {
            slug
            frontmatter {
              title
            }
          }
        }
      }
    }
  `)

  const { allMdx = {} } = data
  const { edges: posts = [] } = allMdx

  posts.forEach((post, i) => {
    const { node, next, previous } = post

    const slug = node.slug
    actions.createPage({
      path: slug,
      component: require.resolve(`./src/templates/Post.tsx`),
      context: { slug, next, previous },
    })
  })
}
