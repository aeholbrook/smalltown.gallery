'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export default function AboutPanel() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-zinc-400 hover:text-white transition-colors"
      >
        About
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-2xl max-h-[70vh] overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-t-xl sm:rounded-xl p-6 sm:p-8 animate-slide-up">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold text-white mb-4">
              About Small Town Documentary
            </h2>
            <div className="space-y-4 text-sm leading-relaxed text-zinc-300">
              <p>
                Professor Dan Overturf started the Small Town Documentary class
                in August 1996, in the Department of Cinema and Photography at
                Southern Illinois University in Carbondale. 4 undergraduate
                students and 2 MFA candidates comprised the first set of
                students to document their chosen communities.
              </p>
              <p>
                Since then, the class has been held in 2000, 2002, 2004, 2006,
                2008, 2010, 2012, 2014, 2016, 2018, and 2020. 91 communities
                in southern Illinois have been documented, some as many as
                three times, by 137 photographers.
              </p>
              <p>
                The course began with an essential premise that has remained
                the core of the class since its inception. Students have been
                tasked with researching and documenting a single southern
                Illinois community, typically south of I-64, for the entire
                4-month fall semester. The students have shown new images each
                week for in-person and, as of 2020, online critiques. Students
                have created individual portfolios and also presented their
                communities with a set of images at the end of each semester.
              </p>
              <p>
                You will note the class was scheduled only in the fall and
                every-other-year. The timing placed the class on either
                gubernatorial or presidential election years. Students also
                photographed unique community fall festivals, homecoming games
                and reunions, Halloween celebrations, Veterans Day
                commemorations and other autumn events.
              </p>
              <p>
                The common thread for all of the students and all the towns,
                discussed in critiques and online, has been the opportunity to
                meet new people and learn about lives beyond their own. The
                impact of reaching outside themselves and their own comfort
                zone, has had a long-lasting impact on the participants.
              </p>
              <p>
                Members of the Small Town Documentary classes would like to
                once again send their deep appreciation to the residents of
                the participating towns. The cooperation of so many
                communities remains at the heart of the class and is essential
                to the success of the photographs.
              </p>
              <p className="text-zinc-400 italic">
                Additional thanks goes out to Adam Holbrook who created this
                website. He was one of the few students who chose to document
                two different towns in two different class sessions. He has
                generously donated his time and talents to establish a
                wonderful online archive.
              </p>
              <p className="text-zinc-400 italic">
                NOTE: Lastly, I would like to send my gratitude to every
                student who has taken the class once and/or sometimes twice,
                and the marvelous former students who came back to TA the
                class. I have enjoyed teaching photography for over 30 years,
                but the Small Town Documentary class has been a uniquely
                splendid experience. Thank you all. — Dan
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
