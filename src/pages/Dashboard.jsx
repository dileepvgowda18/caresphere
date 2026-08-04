import { Link } from 'react-router-dom'

function QuickActionButton({ to, icon, title, description }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-lg"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-xl text-cyan-700">
          {icon}
        </span>
        <div>
          <h4 className="font-semibold text-slate-900">{title}</h4>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </div>
    </Link>
  )
}

function StatCard({ value, label, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <p className={`text-3xl font-semibold ${accent}`}>{value}</p>
      <p className="mt-2 text-sm text-slate-600">{label}</p>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-lg">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 text-2xl text-cyan-700">
        {icon}
      </div>
      <h4 className="text-lg font-semibold text-slate-900">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  )
}

function Dashboard() {
  const quickActions = [
    {
      to: '/prescription-scanner',
      icon: '💊',
      title: 'Prescription Scanner',
      description: 'Extract medicines instantly'
    },
    {
      to: '/medical-report-analyzer',
      icon: '🧪',
      title: 'Medical Report Analyzer',
      description: 'Understand lab findings clearly'
    },
    {
      to: '/hospital-locator',
      icon: '🏥',
      title: 'Hospital Locator',
      description: 'Find nearby care quickly'
    },
    {
      to: '/dashboard',
      icon: '🩺',
      title: 'Symptom Checker',
      description: 'Guide your next step'
    }
  ]

  const stats = [
    { value: '1.2K+', label: 'Prescription Scans', accent: 'text-cyan-700' },
    { value: '850+', label: 'Reports Analyzed', accent: 'text-blue-700' },
    { value: '4.9/5', label: 'Medicine Checks', accent: 'text-emerald-700' },
    { value: '300+', label: 'Hospitals Searched', accent: 'text-violet-700' }
  ]

  const features = [
    { icon: '📷', title: 'OCR Scanner', description: 'Turn scanned prescriptions and reports into actionable data with precision.' },
    { icon: '🧬', title: 'Drug Interaction Checker', description: 'Review medicine combinations for safety and better care decisions.' },
    { icon: '📊', title: 'Medical Report Analyzer', description: 'Summarize lab trends and highlight abnormal values automatically.' },
    { icon: '🧭', title: 'Hospital Locator', description: 'Find nearby hospitals and medical facilities in seconds.' },
    { icon: '📶', title: 'Offline Support', description: 'Access core insights even when your connection is limited.' },
    { icon: '🌐', title: 'Multi-language Support', description: 'Read and navigate healthcare guidance in familiar languages.' }
  ]

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      <section className="grid gap-6 rounded-[2rem] bg-gradient-to-br from-cyan-700 via-sky-700 to-blue-800 p-8 text-white shadow-2xl lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
        <div>
          <p className="mb-3 inline-block rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur">
            MediSphere AI • Smart healthcare access
          </p>
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Make every healthcare step clearer.
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-cyan-50">
            Explore prescriptions, lab reports, hospitals, and essential care tools in one modern dashboard built for confident decisions.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/medical-report-analyzer" className="rounded-full bg-white px-5 py-3 font-semibold text-cyan-800 transition hover:bg-cyan-50">
              Start analysis
            </Link>
            <Link to="/hospital-locator" className="rounded-full border border-white/40 px-5 py-3 font-semibold text-white transition hover:bg-white/10">
              Find hospitals
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/20 bg-white/15 p-5 backdrop-blur">
          <div className="rounded-3xl bg-white p-6 text-slate-800 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-700">Welcome back</p>
                <h3 className="mt-2 text-2xl font-semibold">Hello, Maya</h3>
              </div>
              <div className="rounded-2xl bg-cyan-50 p-3 text-2xl">🩺</div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="text-sm font-medium text-slate-600" htmlFor="dashboard-search">
                Search care tools
              </label>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                <span className="text-slate-400">🔎</span>
                <input
                  id="dashboard-search"
                  type="text"
                  placeholder="Search hospitals, reports, medicines"
                  className="w-full border-none bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-cyan-50 p-4 text-sm text-cyan-800">
              <p className="font-semibold">Care tip</p>
              <p className="mt-1">Use the scanner for prescriptions and reports to keep your healthcare summary organized.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} value={stat.value} label={stat.label} accent={stat.accent} />
        ))}
      </section>

      <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Quick Actions</p>
            <h3 className="text-2xl font-semibold text-slate-900">Start with the care tools you need most</h3>
          </div>
          <p className="text-sm text-slate-600">Smooth navigation for prescriptions, labs, hospitals, and support.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <QuickActionButton key={action.title} {...action} />
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Features</p>
              <h3 className="text-2xl font-semibold text-slate-900">Everything in one intelligent workspace</h3>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-rose-100 p-3 text-2xl">🚑</div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-700">Emergency</p>
              <h3 className="text-2xl font-semibold text-slate-900">Need urgent help?</h3>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <Link to="/hospital-locator" className="flex items-center justify-between rounded-2xl border border-rose-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div>
                <p className="font-semibold text-slate-900">Find Nearby Hospital</p>
                <p className="text-sm text-slate-600">Locate the closest care center quickly</p>
              </div>
              <span className="text-xl text-rose-600">→</span>
            </Link>

            <Link to="/contact" className="flex items-center justify-between rounded-2xl border border-rose-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div>
                <p className="font-semibold text-slate-900">Emergency Contacts</p>
                <p className="text-sm text-slate-600">View immediate support and contact details</p>
              </div>
              <span className="text-xl text-rose-600">→</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
