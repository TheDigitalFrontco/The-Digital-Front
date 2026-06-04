import Hero from './components/sections/Hero'
import WhatWeDo from './components/sections/WhatWeDo'
import WhatWeBuild from './components/sections/WhatWeBuild'
import Process from './components/sections/Process'
import Testimonial from './components/sections/Testimonial'
import StartProject from './components/sections/StartProject'
import Footer from './components/sections/Footer'
import BackToTop from './components/ui/BackToTop'
import { useAnchorScroll } from './hooks/useAnchorScroll'
import { useScrollRestoration } from './hooks/useScrollRestoration'

export default function App() {
  useAnchorScroll() // smooth-scroll in-page links without writing #hash to the URL
  useScrollRestoration() // on reload, return to the section you were viewing (any device)

  return (
    <>
      <main>
        <Hero />
        <WhatWeDo />
        <WhatWeBuild />
        <Process />
        <Testimonial />
        <StartProject />
        <Footer />
      </main>
      <BackToTop />
    </>
  )
}
