/* Reusable scroll-reveal primitives (Framer Motion, component-level).
   <Reveal> is a stagger container; <RevealItem> is a child that fades up.
   Used by every section below the hero so reveals stay consistent. GSAP is
   reserved for scrubbed/pinned scroll choreography, so the two never collide. */

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { staggerParent, fadeUp, inView } from '../../lib/animation'

interface RevealProps {
  children: ReactNode
  className?: string
}

export function Reveal({ children, className }: RevealProps) {
  return (
    <motion.div
      className={className}
      variants={staggerParent}
      initial="hidden"
      whileInView="show"
      viewport={inView}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({ children, className }: RevealProps) {
  return (
    <motion.div className={className} variants={fadeUp}>
      {children}
    </motion.div>
  )
}
