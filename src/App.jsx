import { NavLink, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import HospitalLocator from './pages/HospitalLocator'
import PrescriptionScanner from './pages/PrescriptionScanner'
import About from './pages/About'
import Contact from './pages/Contact'

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <NavLink to="/" className="text-xl font-semibold text-cyan-700">
            CareSphere
          </NavLink>
          <nav className="flex gap-4 text-sm font-medium text-slate-600">
            <NavLink to="/" className={({ isActive }) => (isActive ? 'text-cyan-700' : 'hover:text-cyan-700')}>
              Home
            </NavLink>
            <NavLink to="/hospital-locator" className={({ isActive }) => (isActive ? 'text-cyan-700' : 'hover:text-cyan-700')}>
              Hospital Locator
            </NavLink>
            <NavLink to="/prescription-scanner" className={({ isActive }) => (isActive ? 'text-cyan-700' : 'hover:text-cyan-700')}>
              Prescription Scanner
            </NavLink>
            <NavLink to="/about" className={({ isActive }) => (isActive ? 'text-cyan-700' : 'hover:text-cyan-700')}>
              About
            </NavLink>
            <NavLink to="/contact" className={({ isActive }) => (isActive ? 'text-cyan-700' : 'hover:text-cyan-700')}>
              Contact
            </NavLink>
          </nav>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hospital-locator" element={<HospitalLocator />} />
          <Route path="/prescription-scanner" element={<PrescriptionScanner />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>

      <footer className="border-t border-slate-200 bg-white/80 px-6 py-6 text-center text-sm text-slate-600">
        <p>© 2026 CareSphere. Supporting healthier communities with clarity and care.</p>
      </footer>
    </div>
  )
}

export default App
