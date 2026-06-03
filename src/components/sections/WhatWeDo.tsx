/* WHAT WE DO — two pillars on a light ground. Each card: mono label + index, an
   italic-serif title, a one-line description, then a list of specific offerings
   that fade up in sequence (staggered scroll reveal). Brand card = hairline
   border + faint shadow, sharp corners, hover-lift. Two columns on desktop,
   stacked on mobile. */

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { Reveal, RevealItem } from '../ui/Reveal'
import {
  staggerParent,
  fadeUp,
  inView,
  EASE,
  DURATION,
  prefersReducedMotion,
} from '../../lib/animation'

interface Pillar {
  index: string
  category: string
  title: ReactNode
  description: string
  offerings: string[]
}

const PILLARS: Pillar[] = [
  {
    index: '01',
    category: 'Content',
    title: (
      <>
        Stories, <span className="df-em">told.</span>
      </>
    ),
    description:
      'Scroll-stopping AI-generated content that makes founders impossible to ignore.',
    offerings: [
      'AI-generated videos & reels',
      'Short-form content for Instagram, TikTok & Facebook',
      'UGC-style content',
      'Carousels & static posts',
      'Content calendars & strategy',
      'One-off projects or monthly retainers',
    ],
  },
  {
    index: '02',
    category: 'Websites',
    title: (
      <>
        Sites, <span className="df-em">finished.</span>
      </>
    ),
    description:
      'Fully customizable websites, plus Shopify and WordPress builds, beautiful, fast, and ready to convert.',
    offerings: [
      'Single-page & multi-page websites',
      'Custom animated front-end (Signature work)',
      'Shopify stores',
      'WordPress sites',
      'Fully responsive & built to convert',
      'Connected, live, and ready',
    ],
  },
]

function CheckMark() {
  return (
    <span aria-hidden className="mt-[3px] flex-none text-blue-500">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path
          d="m5 12.5 4.5 4.5L19 7.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

function PillarCard({ pillar }: { pillar: Pillar }) {
  const reduce = prefersReducedMotion()
  return (
    <motion.article
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ duration: DURATION.fast, ease: EASE }}
      className="group flex h-full flex-col rounded-[2px] border border-grey-200 bg-snow p-7 shadow-[var(--shadow-1)] transition-shadow duration-300 hover:shadow-[var(--shadow-2)] sm:p-9"
    >
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[12.5px] font-medium uppercase tracking-[0.22em] text-blue-500">
          {pillar.category}
        </span>
        <span className="font-mono text-[14px] text-grey-400">{pillar.index}</span>
      </div>

      <h3
        className="mt-8"
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: 'clamp(1.75rem, 3.2vw, 2.375rem)',
          lineHeight: 1.04,
          letterSpacing: '-0.018em',
          color: 'var(--blue-950)',
        }}
      >
        {pillar.title}
      </h3>

      <p className="df-body mt-4 max-w-[40ch]">{pillar.description}</p>

      {/* offerings — each fades up in sequence when the list scrolls into view */}
      <motion.ul
        className="mt-7 flex flex-col gap-3 border-t border-grey-200 pt-6"
        variants={staggerParent}
        initial="hidden"
        whileInView="show"
        viewport={inView}
      >
        {pillar.offerings.map((item) => (
          <motion.li key={item} variants={fadeUp} className="flex items-start gap-3">
            <CheckMark />
            <span className="font-sans text-[15px] leading-snug text-grey-700">{item}</span>
          </motion.li>
        ))}
      </motion.ul>
    </motion.article>
  )
}

export default function WhatWeDo() {
  return (
    <section id="services" className="relative bg-grey-50">
      <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <Reveal className="max-w-[30ch]">
          <RevealItem>
            <p className="df-kicker">01 — What we do</p>
          </RevealItem>
          <RevealItem>
            <h2
              className="mt-5"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                fontSize: 'clamp(2rem, 5vw, 3.25rem)',
                lineHeight: 1.02,
                letterSpacing: '-0.02em',
                color: 'var(--blue-950)',
                textWrap: 'balance',
              }}
            >
              Two things, done <span className="df-em">exceptionally.</span>
            </h2>
          </RevealItem>
        </Reveal>

        <Reveal className="mt-12 grid grid-cols-1 gap-5 sm:mt-16 md:grid-cols-2 md:gap-6">
          {PILLARS.map((p) => (
            <RevealItem key={p.index} className="h-full">
              <PillarCard pillar={p} />
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
