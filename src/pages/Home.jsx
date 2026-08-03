const features = [
  {
    title: 'Fast Care Discovery',
    description: 'Locate nearby clinics and hospitals in seconds with a simple, guided experience.',
  },
  {
    title: 'Trusted Information',
    description: 'Access reliable care resources designed to help patients make confident decisions.',
  },
  {
    title: 'Patient-Centered Support',
    description: 'Explore services that support wellness, appointments, and better healthcare access.',
  },
]

function Home() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      <section className="grid items-center gap-10 rounded-3xl bg-gradient-to-br from-cyan-700 via-sky-700 to-blue-800 px-8 py-16 text-white shadow-xl lg:grid-cols-[1.2fr_0.8fr] lg:px-12">
        <div>
          <p className="mb-3 inline-block rounded-full bg-white/20 px-3 py-1 text-sm font-medium">Healthcare made simpler</p>
          <h2 className="mb-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Find the right care, faster.
          </h2>
          <p className="mb-8 max-w-2xl text-lg text-cyan-50">
            CareSphere helps patients and families discover trusted healthcare providers, services, and support in one clean experience.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="/hospital-locator" className="rounded-full bg-white px-5 py-3 font-semibold text-cyan-800 transition hover:bg-cyan-50">
              Find hospitals
            </a>
            <a href="/about" className="rounded-full border border-white/40 px-5 py-3 font-semibold text-white transition hover:bg-white/10">
              Learn more
            </a>
          </div>
        </div>

        <div className="rounded-2xl bg-white/15 p-6 backdrop-blur">
          <div className="rounded-2xl bg-white p-6 text-slate-800 shadow-lg">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Today’s focus</p>
            <h3 className="mt-2 text-2xl font-semibold">Care access at a glance</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>• Nearby medical facilities</li>
              <li>• Easy navigation for urgent needs</li>
              <li>• Supportive healthcare information</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Features</p>
          <h3 className="mt-2 text-3xl font-semibold text-slate-900">Everything you need to feel supported</h3>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h4 className="text-xl font-semibold text-slate-900">{feature.title}</h4>
              <p className="mt-3 text-sm leading-6 text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home
