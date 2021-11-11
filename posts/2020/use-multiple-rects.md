---
title: Multiple element dimensions and positions with useMultipleRects
date: 2020-04-21
excerpt: I wrote a small React hook called useMultipleRects to be able to track the dimensions and positions of multiple elements on window resize and scroll.
tags: [React]
---

tl;dr This is just a small exploration of mine. I wrote a small React hook called `[useMultipleRects](https://github.com/jonahdc/use-multiple-rects)` to be able to track the dimensions and positions of multiple elements on window resize and scroll. Tracking of `DOMRects` of multiple elements is needed to auto-anchor the arrows rendered by `react-archer`.

## Why the hook?

I help out in an open source [PI Planning](https://www.scaledagileframework.com/program-increment/) tool called [Sapling](https://www.github.com/srcclr/sapling) primarily contributing to its [frontend](https://www.github.com/srcclr/sapling-frontend) repo. When you look at Sapling or other planning tools you'll figure that, at least, these tools would consist of boards with tickets or stories grouped by lanes or columns. In Sapling, each story may have dependencies on other stories. What prompted the hook that is `useMultipleRects` , is our attempt to improve the experience by visualizing these dependency relationships between stories through arrows.

#### Visualizing with Arrows

We're currently exploring the idea of visualizing using arrows. We chose a library called `[react-archer](https://github.com/pierpo/react-archer)` for its straightforward APIs that seem fitting for our purposes. From the docs, an `ArcherElement` represents the element that can have multiple `relations` to other `ArcherElement` – these `relations` are the inputs to indicate one element's dependency on another. To illustrate here's a sandbox of the codes straight from `react-archer`'s repo:

<iframe src="https://codesandbox.io/embed/hungry-sunset-7zj36?fontsize=14&hidenavigation=1&theme=dark&view=preview"
     style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     title="hungry-sunset-7zj36"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>

#### The Anchors

From the sandbox, you'll find the `ArcherElement`s to have the following form:

    <ArcherElement
        id="source"
        relations={[{
            targetId: 'target',
            targetAnchor: 'right',
            sourceAnchor: 'left',
        }]}
     >
     // ...

Paying attention to the `relations` field, this `ArcherElement`_depends on_ another `ArcherElement` by the ID of `target` which will then be rendered to have an arrow originating from `ArcherElement` with ID `source` to the other with ID `target`. And what we're interested in are the anchors - `targetAnchor` and `sourceAnchor`.

#### Problem with Anchors

The anchors are fine especially if the diagram being rendered is static. But if you have elements that shift when window is resized or scrolled, a constant `targetAnchor` and `sourceAnchor` will break the display of the arrows. To demonstrate this, play around with the window size and see how the arrows are rendered:
The arrows are fine when the window is sized such that the elements are in 3 row x 2 column arrangement. In which case, 4 points to 3 and 3 points to 1

<iframe src="https://codesandbox.io/embed/runtime-rgb-jr00c?fontsize=14&hidenavigation=1&theme=dark&view=preview"
     style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     title="runtime-rgb-jr00c"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>

### useMultipleRects

In order to fix the described issue with arrows, we just need to make sure `targetAnchor` and `sourceAnchor` values are automatically calculated instead of being supplied with positioning constants. But before that, we first need a way to track the elements and their `DOMRects` – and that's where useMultipleRects come in.

Try resizing the window or the sandbox's panel. You would observe that the arrows are automatically being anchored based on the `DOMRects` of the elements as they are used in the `getAnchors` function.

<iframe src="https://codesandbox.io/embed/practical-shtern-r0mxd?fontsize=14&hidenavigation=1&theme=dark"
     style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     title="practical-shtern-r0mxd"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>
