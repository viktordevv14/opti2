import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowLeft,
  Banknote,
  Calendar,
  CheckCircle2,
  Clipboard,
  CreditCard,
  Eye,
  FileText,
  Glasses,
  LogOut,
  Mail,
  Package2,
  Phone,
  PlusCircle,
  Search,
  ShieldCheck,
  Trash2,
  User,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react'
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from './firebase'
import { useLocalStorage } from './useLocalStorage'

const demoUsers = [
  {
    email: 'admin@opticare.test',
    password: 'admin123',
    role: 'admin',
    name: 'Clinic Admin',
  },
  {
    email: 'optician@opticare.test',
    password: 'optician123',
    role: 'optician',
    name: 'Lead Optician',
  },
]

const defaultFrameTypes = ['Full Rim', 'Semi Rimless', 'Rimless', 'Cat Eye', 'Round', 'Square', 'Aviator']

const createPatientForm = () => ({
  name: '',
  dob: '',
  phone: '',
  email: '',
  notes: '',
  sphereL: '0.00',
  cylinderL: '0.00',
  axisL: '0',
  sphereR: '0.00',
  cylinderR: '0.00',
  axisR: '0',
  add: '0.00',
  frameType: '',
  lensType: '',
})

const createPrescriptionForm = () => ({
  patientId: '',
  date: new Date().toISOString().split('T')[0],
  sphereL: '0.00',
  cylinderL: '0.00',
  axisL: '0',
  sphereR: '0.00',
  cylinderR: '0.00',
  axisR: '0',
  add: '0.00',
  notes: '',
})

const createPaymentForm = () => ({
  patientId: '',
  amount: '',
  method: 'Mpesa',
  reference: '',
  notes: '',
  paidAt: new Date().toISOString().split('T')[0],
})

const createFrameForm = () => ({
  name: '',
  type: '',
  brand: '',
  material: '',
  quantity: '1',
  unitPrice: '',
})

const currencyFormatter = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
})

function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0)
}

function StatCard({ title, value, hint, icon: Icon, tone = 'blue' }) {
  const tones = {
    blue: { icon: 'bg-blue-600', badge: 'bg-blue-50 text-blue-600' },
    emerald: { icon: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-600' },
    purple: { icon: 'bg-purple-600', badge: 'bg-purple-50 text-purple-600' },
    amber: { icon: 'bg-amber-500', badge: 'bg-amber-50 text-amber-600' },
  }

  const currentTone = tones[tone]

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 p-7 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-gray-400">{title}</p>
          <p className="mt-2 text-4xl font-black text-gray-900">{value}</p>
          {hint && <p className={`mt-4 inline-flex rounded-xl px-3 py-1 text-xs font-bold ${currentTone.badge}`}>{hint}</p>}
        </div>
        <div className={`${currentTone.icon} flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}

function App() {
  const [currentUser, setCurrentUser] = useLocalStorage('opticare-session', null)
  const [loginForm, setLoginForm] = useState({
    email: 'admin@opticare.test',
    password: 'admin123',
  })
  const [loginError, setLoginError] = useState('')

  const [activeTab, setActiveTab] = useState('dashboard')
  const [patients, setPatients] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [payments, setPayments] = useLocalStorage('opticare-payments', [])
  const [frames, setFrames] = useLocalStorage('opticare-frames', [])
  const [searchTerm, setSearchTerm] = useState('')
  const [showPatientForm, setShowPatientForm] = useState(false)
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false)
  const [viewingPatientId, setViewingPatientId] = useState(null)
  const [newPatient, setNewPatient] = useState(createPatientForm())
  const [newPrescription, setNewPrescription] = useState(createPrescriptionForm())
  const [newPayment, setNewPayment] = useState(createPaymentForm())
  const [newFrame, setNewFrame] = useState(createFrameForm())

  const isAdmin = currentUser?.role === 'admin'

  useEffect(() => {
    const patientsQuery = query(collection(db, 'patients'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(
      patientsQuery,
      (snapshot) => {
        setPatients(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
      },
      (error) => {
        console.error('Firestore error (patients):', error)
      },
    )

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const prescriptionsQuery = query(collection(db, 'prescriptions'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(
      prescriptionsQuery,
      (snapshot) => {
        setPrescriptions(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
      },
      (error) => {
        console.error('Firestore error (prescriptions):', error)
      },
    )

    return () => unsubscribe()
  }, [])

  const filteredPatients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    if (!term) return patients

    return patients.filter((patient) => {
      const values = [patient.name, patient.phone, patient.email, patient.frameType]
      return values.some((value) => String(value || '').toLowerCase().includes(term))
    })
  }, [patients, searchTerm])

  const filteredPrescriptions = useMemo(() => {
    return prescriptions
      .map((prescription) => ({
        ...prescription,
        patient: patients.find((patient) => patient.id === prescription.patientId),
      }))
      .filter((prescription) => prescription.patient)
  }, [prescriptions, patients])

  const frameTypeOptions = useMemo(() => {
    return Array.from(
      new Set([...defaultFrameTypes, ...frames.map((frame) => frame.type), ...patients.map((patient) => patient.frameType)]),
    ).filter(Boolean)
  }, [frames, patients])

  const paymentsByPatient = useMemo(() => {
    return payments.reduce((accumulator, payment) => {
      accumulator[payment.patientId] = accumulator[payment.patientId] || []
      accumulator[payment.patientId].push(payment)
      return accumulator
    }, {})
  }, [payments])

  const paymentSummaryByPatient = useMemo(() => {
    return payments.reduce((accumulator, payment) => {
      const current = accumulator[payment.patientId] || { total: 0, count: 0, lastMethod: '' }
      current.total += Number(payment.amount) || 0
      current.count += 1
      current.lastMethod = payment.method
      accumulator[payment.patientId] = current
      return accumulator
    }, {})
  }, [payments])

  const totalCollected = useMemo(() => {
    return payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
  }, [payments])

  const lowStockFrames = useMemo(() => {
    return frames.filter((frame) => Number(frame.quantity) <= 2)
  }, [frames])

  const selectedPatient = patients.find((patient) => patient.id === viewingPatientId)
  const patientPrescriptions = selectedPatient
    ? prescriptions.filter((prescription) => prescription.patientId === selectedPatient.id)
    : []
  const patientPayments = selectedPatient ? paymentsByPatient[selectedPatient.id] || [] : []

  const closePanels = () => {
    setShowPatientForm(false)
    setShowPrescriptionForm(false)
    setViewingPatientId(null)
  }

  const goToTab = (tab) => {
    closePanels()
    setActiveTab(tab)
  }

  const handleLogin = (event) => {
    event.preventDefault()

    const match = demoUsers.find(
      (user) => user.email === loginForm.email.trim().toLowerCase() && user.password === loginForm.password,
    )

    if (!match) {
      setLoginError('Invalid email or password.')
      return
    }

    setCurrentUser({ email: match.email, name: match.name, role: match.role })
    setLoginError('')
    setActiveTab('dashboard')
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setLoginForm({ email: 'admin@opticare.test', password: 'admin123' })
    setLoginError('')
    setActiveTab('dashboard')
    closePanels()
  }

  const handleAddPatient = async (event) => {
    event.preventDefault()

    try {
      await addDoc(collection(db, 'patients'), {
        ...newPatient,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.role,
      })
      setNewPatient(createPatientForm())
      setShowPatientForm(false)
      setActiveTab('patients')
    } catch (error) {
      console.error('Error adding patient:', error)
      window.alert('Unable to save patient right now.')
    }
  }

  const handleDeletePatient = async (patientId) => {
    if (!window.confirm('Delete this patient and all linked prescriptions?')) return

    try {
      await deleteDoc(doc(db, 'patients', patientId))

      const linkedPrescriptions = prescriptions.filter((prescription) => prescription.patientId === patientId)
      for (const prescription of linkedPrescriptions) {
        await deleteDoc(doc(db, 'prescriptions', prescription.id))
      }
    } catch (error) {
      console.error('Error deleting patient:', error)
      window.alert('Unable to delete patient right now.')
    }
  }

  const handleAddPrescription = async (event) => {
    event.preventDefault()

    try {
      await addDoc(collection(db, 'prescriptions'), {
        ...newPrescription,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.role,
      })
      setNewPrescription(createPrescriptionForm())
      setShowPrescriptionForm(false)
      setActiveTab('prescriptions')
    } catch (error) {
      console.error('Error adding prescription:', error)
      window.alert('Unable to save prescription right now.')
    }
  }

  const handleDeletePrescription = async (prescriptionId) => {
    if (!window.confirm('Delete this prescription?')) return

    try {
      await deleteDoc(doc(db, 'prescriptions', prescriptionId))
    } catch (error) {
      console.error('Error deleting prescription:', error)
      window.alert('Unable to delete prescription right now.')
    }
  }

  const handleAddPayment = (event) => {
    event.preventDefault()

    if (!isAdmin) return

    setPayments([
      {
        id: crypto.randomUUID(),
        ...newPayment,
        amount: Number(newPayment.amount) || 0,
        createdAt: new Date().toISOString(),
        receivedBy: currentUser.name,
      },
      ...payments,
    ])
    setNewPayment(createPaymentForm())
  }

  const handleDeletePayment = (paymentId) => {
    if (!isAdmin || !window.confirm('Delete this payment record?')) return

    setPayments(payments.filter((payment) => payment.id !== paymentId))
  }

  const handleAddFrame = (event) => {
    event.preventDefault()

    if (!isAdmin) return

    setFrames([
      {
        id: crypto.randomUUID(),
        ...newFrame,
        quantity: Number(newFrame.quantity) || 0,
        unitPrice: Number(newFrame.unitPrice) || 0,
        createdAt: new Date().toISOString(),
        addedBy: currentUser.name,
      },
      ...frames,
    ])
    setNewFrame(createFrameForm())
  }

  const handleDeleteFrame = (frameId) => {
    if (!isAdmin || !window.confirm('Delete this frame item?')) return

    setFrames(frames.filter((frame) => frame.id !== frameId))
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 p-10 text-white shadow-2xl sm:p-12">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                <Glasses className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.35em] text-blue-200">OptiCare</p>
                <h1 className="mt-1 text-4xl font-black tracking-tight">Clinic access portal</h1>
              </div>
            </div>

            <p className="mt-8 max-w-xl text-lg text-blue-100/80">
              Sign in as an optician or admin to manage patients, prescriptions, payments, and frame inventory.
            </p>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 backdrop-blur">
                <div className="flex items-center gap-3 text-white">
                  <ShieldCheck className="h-6 w-6 text-amber-300" />
                  <h2 className="text-xl font-black">Admin</h2>
                </div>
                <p className="mt-4 text-sm text-blue-100/80">Can record payments, manage frames, and review the full clinic dashboard.</p>
                <div className="mt-5 rounded-2xl bg-black/20 p-4 text-sm">
                  <p><span className="font-bold">Email:</span> admin@opticare.test</p>
                  <p className="mt-1"><span className="font-bold">Password:</span> admin123</p>
                </div>
                <button
                  onClick={() => {
                    setLoginForm({ email: 'admin@opticare.test', password: 'admin123' })
                    setLoginError('')
                  }}
                  className="mt-5 rounded-2xl bg-white px-4 py-3 font-bold text-blue-900 transition hover:bg-blue-50"
                >
                  Use admin demo
                </button>
              </div>

              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 backdrop-blur">
                <div className="flex items-center gap-3 text-white">
                  <Eye className="h-6 w-6 text-emerald-300" />
                  <h2 className="text-xl font-black">Optician</h2>
                </div>
                <p className="mt-4 text-sm text-blue-100/80">Can manage patients and prescriptions with the same clinical workflow.</p>
                <div className="mt-5 rounded-2xl bg-black/20 p-4 text-sm">
                  <p><span className="font-bold">Email:</span> optician@opticare.test</p>
                  <p className="mt-1"><span className="font-bold">Password:</span> optician123</p>
                </div>
                <button
                  onClick={() => {
                    setLoginForm({ email: 'optician@opticare.test', password: 'optician123' })
                    setLoginError('')
                  }}
                  className="mt-5 rounded-2xl bg-white px-4 py-3 font-bold text-blue-900 transition hover:bg-blue-50"
                >
                  Use optician demo
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-gray-200 bg-white p-8 shadow-xl sm:p-10">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.35em] text-blue-600">Login</p>
              <h2 className="mt-3 text-3xl font-black text-gray-900">Welcome back</h2>
              <p className="mt-3 text-gray-500">Use one of the demo accounts to access the clinic workspace.</p>
            </div>

            <form onSubmit={handleLogin} className="mt-10 space-y-6">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Email</label>
                <input
                  type="email"
                  required
                  value={loginForm.email}
                  onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Password</label>
                <input
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {loginError && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{loginError}</div>}

              <button
                type="submit"
                className="w-full rounded-[1.5rem] bg-blue-600 px-6 py-4 text-lg font-black text-white shadow-lg transition hover:bg-blue-700"
              >
                Sign in to OptiCare
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <button onClick={() => goToTab('dashboard')} className="flex items-center gap-3 text-left">
            <div className="rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 p-3 text-white shadow-lg">
              <Glasses className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-600">OptiCare</p>
              <p className="text-2xl font-black tracking-tight text-gray-900">Clinical workspace</p>
            </div>
          </button>

          <div className="flex flex-col gap-3 lg:items-end">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full bg-blue-50 px-4 py-2 font-bold text-blue-700">{currentUser.name}</span>
              <span className={`rounded-full px-4 py-2 font-bold ${isAdmin ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {isAdmin ? 'Admin' : 'Optician'}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 font-bold text-gray-600 transition hover:border-gray-300 hover:bg-gray-100"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>

            <div className="flex flex-wrap gap-2 rounded-2xl bg-gray-100 p-1.5">
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'patients', label: 'Patients' },
                { id: 'prescriptions', label: 'Prescriptions' },
                ...(isAdmin ? [{ id: 'admin', label: 'Admin' }] : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => goToTab(tab.id)}
                  className={`rounded-xl px-4 py-2 text-sm font-black transition ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-white/70 hover:text-gray-900'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'dashboard' && !showPatientForm && !showPrescriptionForm && !viewingPatientId && (
          <div className="space-y-10">
            <section className="overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 p-8 text-white shadow-2xl sm:p-12">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.4em] text-blue-200">{isAdmin ? 'Admin dashboard' : 'Optician dashboard'}</p>
                  <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Welcome back to OptiCare</h1>
                  <p className="mt-4 max-w-2xl text-lg text-blue-100/80">
                    Keep patient records, prescriptions, payments, and frame inventory in one place.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-3xl border border-white/15 bg-white/10 p-5 text-center backdrop-blur">
                    <p className="text-xs font-black uppercase tracking-widest text-blue-200">Status</p>
                    <p className="mt-3 flex items-center justify-center gap-2 font-bold text-white">
                      <Activity size={16} className="text-green-400" /> Online
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/15 bg-white/10 p-5 text-center backdrop-blur">
                    <p className="text-xs font-black uppercase tracking-widest text-blue-200">Today</p>
                    <p className="mt-3 font-bold text-white">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Patients" value={patients.length} hint="Active records" icon={Users} tone="blue" />
              <StatCard title="Prescriptions" value={prescriptions.length} hint="Clinical history" icon={FileText} tone="emerald" />
              <StatCard title="Payments" value={payments.length} hint={formatCurrency(totalCollected)} icon={Wallet} tone="amber" />
              <StatCard title="Frames" value={frames.length} hint={`${lowStockFrames.length} low stock`} icon={Package2} tone="purple" />
            </section>

            <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-gray-900">Quick actions</h2>
                  <div className="h-1 w-12 rounded-full bg-blue-600" />
                </div>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  <button
                    onClick={() => {
                      setShowPatientForm(true)
                      setActiveTab('patients')
                    }}
                    className="rounded-[2rem] border border-gray-100 bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <UserPlus size={26} />
                    </div>
                    <h3 className="mt-6 text-xl font-black text-gray-900">Add patient</h3>
                    <p className="mt-2 text-sm text-gray-500">Create a new patient record and store frame preferences.</p>
                  </button>

                  <button
                    onClick={() => {
                      setShowPrescriptionForm(true)
                      setActiveTab('prescriptions')
                    }}
                    className="rounded-[2rem] border border-gray-100 bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <FileText size={26} />
                    </div>
                    <h3 className="mt-6 text-xl font-black text-gray-900">Issue prescription</h3>
                    <p className="mt-2 text-sm text-gray-500">Record refraction details and dispensing instructions.</p>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => goToTab('admin')}
                      className="rounded-[2rem] border border-gray-100 bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                        <CreditCard size={26} />
                      </div>
                      <h3 className="mt-6 text-xl font-black text-gray-900">Track payments</h3>
                      <p className="mt-2 text-sm text-gray-500">Record cash or Mpesa payments and update frame inventory.</p>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-gray-900">Recent enrollments</h2>
                  <button onClick={() => goToTab('patients')} className="text-sm font-black text-blue-600 hover:underline">
                    View all
                  </button>
                </div>
                <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
                  {patients.slice(0, 5).map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => {
                        setViewingPatientId(patient.id)
                        setActiveTab('patients')
                      }}
                      className="flex w-full items-center justify-between gap-4 border-b border-gray-50 px-6 py-5 text-left transition hover:bg-slate-50 last:border-b-0"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-lg font-black text-blue-600">
                          {patient.name?.charAt(0)?.toUpperCase() || 'P'}
                        </div>
                        <div>
                          <p className="font-black text-gray-900">{patient.name}</p>
                          <p className="mt-1 text-sm text-gray-500">{patient.phone}</p>
                        </div>
                      </div>
                      <ArrowLeft className="rotate-180 text-gray-300" size={18} />
                    </button>
                  ))}
                  {patients.length === 0 && <div className="px-6 py-16 text-center text-gray-400">No patients registered yet.</div>}
                </div>
              </div>
            </section>
          </div>
        )}

        {viewingPatientId && selectedPatient && (
          <div className="space-y-8">
            <button
              onClick={() => setViewingPatientId(null)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-bold text-gray-600 shadow-sm transition hover:bg-gray-100"
            >
              <ArrowLeft size={18} /> Back to patients
            </button>

            <section className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-blue-50 text-3xl font-black text-blue-600">
                    {selectedPatient.name?.charAt(0)?.toUpperCase() || 'P'}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-900">{selectedPatient.name}</h2>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-500">
                      <span className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-4 py-2"><Calendar size={14} /> {selectedPatient.dob}</span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-4 py-2"><Phone size={14} /> {selectedPatient.phone}</span>
                      {selectedPatient.email && <span className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-4 py-2"><Mail size={14} /> {selectedPatient.email}</span>}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedPatient.frameType && <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-orange-700">Frame: {selectedPatient.frameType}</span>}
                      {selectedPatient.lensType && <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-indigo-700">Lens: {selectedPatient.lensType}</span>}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-emerald-50 p-5">
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Total paid</p>
                    <p className="mt-3 text-2xl font-black text-gray-900">
                      {formatCurrency(paymentSummaryByPatient[selectedPatient.id]?.total || 0)}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">{paymentSummaryByPatient[selectedPatient.id]?.count || 0} payment entries</p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-5">
                    <p className="text-xs font-black uppercase tracking-widest text-blue-600">Last payment method</p>
                    <p className="mt-3 text-2xl font-black text-gray-900">{paymentSummaryByPatient[selectedPatient.id]?.lastMethod || 'Not paid'}</p>
                    <p className="mt-2 text-sm text-gray-500">Updated from admin records</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
                <h3 className="text-xl font-black text-gray-900">Clinical notes</h3>
                <p className="mt-5 rounded-2xl bg-gray-50 p-5 leading-relaxed text-gray-600">
                  {selectedPatient.notes || 'No clinical notes recorded for this patient.'}
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-gray-50 p-5">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Left eye</p>
                    <p className="mt-3 font-mono text-lg font-black text-gray-900">
                      SPH {selectedPatient.sphereL} / CYL {selectedPatient.cylinderL} / AXIS {selectedPatient.axisL}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-5">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Right eye</p>
                    <p className="mt-3 font-mono text-lg font-black text-gray-900">
                      SPH {selectedPatient.sphereR} / CYL {selectedPatient.cylinderR} / AXIS {selectedPatient.axisR}
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl bg-blue-50 p-5">
                  <p className="text-xs font-black uppercase tracking-widest text-blue-500">Addition power</p>
                  <p className="mt-2 text-2xl font-black text-blue-700">+{selectedPatient.add}</p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
                <h3 className="text-xl font-black text-gray-900">Payment history</h3>
                <div className="mt-6 space-y-4">
                  {patientPayments.length > 0 ? (
                    patientPayments.map((payment) => (
                      <div key={payment.id} className="rounded-2xl border border-gray-100 p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-black text-gray-900">{formatCurrency(payment.amount)}</p>
                            <p className="mt-1 text-sm text-gray-500">{payment.method} • {payment.reference || 'No reference'}</p>
                          </div>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-emerald-700">
                            Paid
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-gray-500">Paid on {payment.paidAt} by {payment.receivedBy || 'Admin'}</p>
                        {payment.notes && <p className="mt-2 text-sm text-gray-600">{payment.notes}</p>}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 px-5 py-12 text-center text-gray-400">
                      No payment records yet for this patient.
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-gray-900">Prescription history</h3>
                <button
                  onClick={() => {
                    setNewPrescription({ ...createPrescriptionForm(), patientId: selectedPatient.id })
                    setShowPrescriptionForm(true)
                    setViewingPatientId(null)
                    setActiveTab('prescriptions')
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700"
                >
                  <PlusCircle size={18} /> New prescription
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {patientPrescriptions.length > 0 ? (
                  patientPrescriptions.map((prescription) => (
                    <div key={prescription.id} className="rounded-2xl border border-gray-100 p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-black uppercase tracking-widest text-blue-500">Issued {prescription.date}</p>
                          <p className="mt-3 font-mono text-gray-700">OS {prescription.sphereL}/{prescription.cylinderL}/{prescription.axisL} • OD {prescription.sphereR}/{prescription.cylinderR}/{prescription.axisR}</p>
                          <p className="mt-2 font-mono text-sm text-gray-500">ADD +{prescription.add}</p>
                          {prescription.notes && <p className="mt-3 text-sm text-gray-600">{prescription.notes}</p>}
                        </div>
                        <button
                          onClick={() => handleDeletePrescription(prescription.id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-red-100 px-4 py-3 font-bold text-red-500 transition hover:bg-red-50"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 px-5 py-12 text-center text-gray-400">
                    No prescription records found for this patient.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'patients' && !showPatientForm && !showPrescriptionForm && !viewingPatientId && (
          <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-3xl font-black text-gray-900">Patient database</h2>
                <p className="mt-2 text-gray-500">Manage patient records, frame preferences, and payment status.</p>
              </div>
              <button
                onClick={() => setShowPatientForm(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white transition hover:bg-blue-700"
              >
                <UserPlus size={18} /> New patient
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by patient name, phone, email, or frame type..."
                className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-4 text-gray-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => {
                  const patientSummary = paymentSummaryByPatient[patient.id] || { total: 0, count: 0 }

                  return (
                    <div key={patient.id} className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                      <div className="flex items-start justify-between gap-4">
                        <button onClick={() => setViewingPatientId(patient.id)} className="flex items-start gap-4 text-left">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-xl font-black text-blue-600">
                            {patient.name?.charAt(0)?.toUpperCase() || 'P'}
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-gray-900">{patient.name}</h3>
                            <p className="mt-1 text-sm text-gray-500">{patient.phone}</p>
                          </div>
                        </button>
                        <button
                          onClick={() => handleDeletePatient(patient.id)}
                          className="rounded-xl p-2 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                          title="Delete patient"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="mt-6 space-y-3 text-sm text-gray-500">
                        <p><span className="font-bold text-gray-700">DOB:</span> {patient.dob}</p>
                        {patient.email && <p><span className="font-bold text-gray-700">Email:</span> {patient.email}</p>}
                        <p><span className="font-bold text-gray-700">Payments:</span> {patientSummary.count} record(s)</p>
                        <p><span className="font-bold text-gray-700">Collected:</span> {formatCurrency(patientSummary.total)}</p>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {patient.frameType && <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-orange-700">Frame: {patient.frameType}</span>}
                        {patient.lensType && <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-indigo-700">Lens: {patient.lensType}</span>}
                      </div>

                      <div className="mt-6 flex gap-3">
                        <button
                          onClick={() => setViewingPatientId(patient.id)}
                          className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 font-bold text-gray-700 transition hover:bg-gray-50"
                        >
                          View record
                        </button>
                        <button
                          onClick={() => {
                            setNewPrescription({ ...createPrescriptionForm(), patientId: patient.id })
                            setShowPrescriptionForm(true)
                            setActiveTab('prescriptions')
                          }}
                          className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700"
                        >
                          New Rx
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-full rounded-[2rem] border border-dashed border-gray-300 bg-white px-6 py-20 text-center text-gray-400">
                  No patient records found.
                </div>
              )}
            </div>
          </div>
        )}

        {showPatientForm && (
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-gray-100 bg-white p-8 shadow-xl sm:p-10">
            <button
              onClick={() => setShowPatientForm(false)}
              className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 font-bold text-gray-600 transition hover:bg-gray-200"
            >
              <ArrowLeft size={18} /> Back to database
            </button>

            <div className="mt-8">
              <h2 className="text-3xl font-black text-gray-900">Add new patient</h2>
              <p className="mt-2 text-gray-500">Capture personal details, eye measures, and frame type preference.</p>
            </div>

            <form onSubmit={handleAddPatient} className="mt-10 space-y-10">
              <section className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-blue-600">Personal information</h3>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Full name *</label>
                    <input
                      required
                      type="text"
                      value={newPatient.name}
                      onChange={(event) => setNewPatient({ ...newPatient, name: event.target.value })}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Date of birth *</label>
                    <input
                      required
                      type="date"
                      value={newPatient.dob}
                      onChange={(event) => setNewPatient({ ...newPatient, dob: event.target.value })}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Phone number *</label>
                    <input
                      required
                      type="tel"
                      value={newPatient.phone}
                      onChange={(event) => setNewPatient({ ...newPatient, phone: event.target.value })}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Email</label>
                    <input
                      type="email"
                      value={newPatient.email}
                      onChange={(event) => setNewPatient({ ...newPatient, email: event.target.value })}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-6 border-t border-gray-100 pt-10">
                <h3 className="text-sm font-black uppercase tracking-widest text-blue-600">Initial refraction</h3>
                <div className="grid gap-8 lg:grid-cols-2">
                  <div className="rounded-[2rem] bg-gray-50 p-6">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Left eye (OS)</p>
                    <div className="mt-5 grid grid-cols-3 gap-4">
                      <input value={newPatient.sphereL} onChange={(event) => setNewPatient({ ...newPatient, sphereL: event.target.value })} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center font-mono outline-none focus:border-blue-500" placeholder="SPH" />
                      <input value={newPatient.cylinderL} onChange={(event) => setNewPatient({ ...newPatient, cylinderL: event.target.value })} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center font-mono outline-none focus:border-blue-500" placeholder="CYL" />
                      <input value={newPatient.axisL} onChange={(event) => setNewPatient({ ...newPatient, axisL: event.target.value })} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center font-mono outline-none focus:border-blue-500" placeholder="AXIS" />
                    </div>
                  </div>
                  <div className="rounded-[2rem] bg-gray-50 p-6">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Right eye (OD)</p>
                    <div className="mt-5 grid grid-cols-3 gap-4">
                      <input value={newPatient.sphereR} onChange={(event) => setNewPatient({ ...newPatient, sphereR: event.target.value })} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center font-mono outline-none focus:border-blue-500" placeholder="SPH" />
                      <input value={newPatient.cylinderR} onChange={(event) => setNewPatient({ ...newPatient, cylinderR: event.target.value })} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center font-mono outline-none focus:border-blue-500" placeholder="CYL" />
                      <input value={newPatient.axisR} onChange={(event) => setNewPatient({ ...newPatient, axisR: event.target.value })} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center font-mono outline-none focus:border-blue-500" placeholder="AXIS" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Addition power</label>
                  <input
                    value={newPatient.add}
                    onChange={(event) => setNewPatient({ ...newPatient, add: event.target.value })}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 font-mono outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </section>

              <section className="space-y-6 border-t border-gray-100 pt-10">
                <h3 className="text-sm font-black uppercase tracking-widest text-blue-600">Dispensing preferences</h3>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Frame type option</label>
                    <select
                      value={newPatient.frameType}
                      onChange={(event) => setNewPatient({ ...newPatient, frameType: event.target.value })}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    >
                      <option value="">Select frame type</option>
                      {frameTypeOptions.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Lens type / coating</label>
                    <input
                      value={newPatient.lensType}
                      onChange={(event) => setNewPatient({ ...newPatient, lensType: event.target.value })}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Blue-cut, progressive, anti-reflective"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Clinical notes</label>
                    <textarea
                      rows={4}
                      value={newPatient.notes}
                      onChange={(event) => setNewPatient({ ...newPatient, notes: event.target.value })}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>
              </section>

              <button type="submit" className="w-full rounded-[1.75rem] bg-blue-600 px-6 py-5 text-lg font-black text-white shadow-lg transition hover:bg-blue-700">
                Save patient record
              </button>
            </form>
          </div>
        )}

        {activeTab === 'prescriptions' && !showPrescriptionForm && !viewingPatientId && (
          <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-3xl font-black text-gray-900">Prescription records</h2>
                <p className="mt-2 text-gray-500">Review clinical prescriptions linked to each patient.</p>
              </div>
              <button
                onClick={() => setShowPrescriptionForm(true)}
                disabled={patients.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PlusCircle size={18} /> New prescription
              </button>
            </div>

            <div className="space-y-5">
              {filteredPrescriptions.length > 0 ? (
                filteredPrescriptions.map((prescription) => (
                  <div key={prescription.id} className="rounded-[2rem] border border-gray-100 bg-white p-7 shadow-sm">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-2xl font-black text-gray-900">{prescription.patient.name}</h3>
                        <p className="mt-2 text-sm font-bold uppercase tracking-widest text-blue-500">Issued on {prescription.date}</p>
                        <div className="mt-5 grid gap-4 lg:grid-cols-2">
                          <div className="rounded-2xl bg-gray-50 p-5 text-sm text-gray-700">
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Left eye</p>
                            <p className="mt-2 font-mono">SPH {prescription.sphereL} / CYL {prescription.cylinderL} / AXIS {prescription.axisL}</p>
                          </div>
                          <div className="rounded-2xl bg-gray-50 p-5 text-sm text-gray-700">
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Right eye</p>
                            <p className="mt-2 font-mono">SPH {prescription.sphereR} / CYL {prescription.cylinderR} / AXIS {prescription.axisR}</p>
                          </div>
                        </div>
                        <p className="mt-4 text-sm font-bold text-blue-600">ADD +{prescription.add}</p>
                        {prescription.notes && <p className="mt-3 text-sm text-gray-600">{prescription.notes}</p>}
                      </div>

                      <button
                        onClick={() => handleDeletePrescription(prescription.id)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-red-100 px-4 py-3 font-bold text-red-500 transition hover:bg-red-50"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[2rem] border border-dashed border-gray-300 bg-white px-6 py-20 text-center text-gray-400">
                  No prescriptions recorded yet.
                </div>
              )}
            </div>
          </div>
        )}

        {showPrescriptionForm && (
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-gray-100 bg-white p-8 shadow-xl sm:p-10">
            <button
              onClick={() => setShowPrescriptionForm(false)}
              className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 font-bold text-gray-600 transition hover:bg-gray-200"
            >
              <ArrowLeft size={18} /> Back to records
            </button>

            <div className="mt-8">
              <h2 className="text-3xl font-black text-gray-900">New prescription</h2>
              <p className="mt-2 text-gray-500">Store refraction details for a selected patient.</p>
            </div>

            <form onSubmit={handleAddPrescription} className="mt-10 space-y-10">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Selected patient *</label>
                <select
                  required
                  value={newPrescription.patientId}
                  onChange={(event) => setNewPrescription({ ...newPrescription, patientId: event.target.value })}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="">Choose patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>{patient.name} • {patient.phone}</option>
                  ))}
                </select>
              </div>

              <section className="space-y-6 border-t border-gray-100 pt-10">
                <h3 className="text-sm font-black uppercase tracking-widest text-blue-600">Refraction analysis</h3>
                <div className="grid gap-8 lg:grid-cols-2">
                  <div className="rounded-[2rem] bg-gray-50 p-6">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Left eye (OS)</p>
                    <div className="mt-5 grid grid-cols-3 gap-4">
                      <input value={newPrescription.sphereL} onChange={(event) => setNewPrescription({ ...newPrescription, sphereL: event.target.value })} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center font-mono outline-none focus:border-blue-500" placeholder="SPH" />
                      <input value={newPrescription.cylinderL} onChange={(event) => setNewPrescription({ ...newPrescription, cylinderL: event.target.value })} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center font-mono outline-none focus:border-blue-500" placeholder="CYL" />
                      <input value={newPrescription.axisL} onChange={(event) => setNewPrescription({ ...newPrescription, axisL: event.target.value })} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center font-mono outline-none focus:border-blue-500" placeholder="AXIS" />
                    </div>
                  </div>
                  <div className="rounded-[2rem] bg-gray-50 p-6">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Right eye (OD)</p>
                    <div className="mt-5 grid grid-cols-3 gap-4">
                      <input value={newPrescription.sphereR} onChange={(event) => setNewPrescription({ ...newPrescription, sphereR: event.target.value })} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center font-mono outline-none focus:border-blue-500" placeholder="SPH" />
                      <input value={newPrescription.cylinderR} onChange={(event) => setNewPrescription({ ...newPrescription, cylinderR: event.target.value })} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center font-mono outline-none focus:border-blue-500" placeholder="CYL" />
                      <input value={newPrescription.axisR} onChange={(event) => setNewPrescription({ ...newPrescription, axisR: event.target.value })} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center font-mono outline-none focus:border-blue-500" placeholder="AXIS" />
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Addition power</label>
                    <input
                      value={newPrescription.add}
                      onChange={(event) => setNewPrescription({ ...newPrescription, add: event.target.value })}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 font-mono outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Exam date</label>
                    <input
                      required
                      type="date"
                      value={newPrescription.date}
                      onChange={(event) => setNewPrescription({ ...newPrescription, date: event.target.value })}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>
              </section>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Dispensing notes</label>
                <textarea
                  rows={4}
                  value={newPrescription.notes}
                  onChange={(event) => setNewPrescription({ ...newPrescription, notes: event.target.value })}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <button type="submit" className="w-full rounded-[1.75rem] bg-blue-600 px-6 py-5 text-lg font-black text-white shadow-lg transition hover:bg-blue-700">
                Save prescription
              </button>
            </form>
          </div>
        )}

        {activeTab === 'admin' && isAdmin && !showPatientForm && !showPrescriptionForm && !viewingPatientId && (
          <div className="space-y-8">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.35em] text-amber-600">Admin tools</p>
              <h2 className="mt-3 text-3xl font-black text-gray-900">Payments and frame tracking</h2>
              <p className="mt-2 text-gray-500">Track payments after patients pay with Mpesa or cash, and manage frame stock by type.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <StatCard title="Payments received" value={payments.length} hint={formatCurrency(totalCollected)} icon={CreditCard} tone="amber" />
              <StatCard title="Frame inventory" value={frames.length} hint={`${frameTypeOptions.length} frame types`} icon={Package2} tone="purple" />
              <StatCard title="Low stock" value={lowStockFrames.length} hint="Qty 2 or lower" icon={Clipboard} tone="blue" />
            </div>

            <div className="grid gap-8 xl:grid-cols-2">
              <section className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                    <Banknote size={22} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900">Record payment</h3>
                    <p className="text-sm text-gray-500">Capture cash or Mpesa payments for a patient.</p>
                  </div>
                </div>

                <form onSubmit={handleAddPayment} className="mt-8 space-y-5">
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Patient *</label>
                    <select
                      required
                      value={newPayment.patientId}
                      onChange={(event) => setNewPayment({ ...newPayment, patientId: event.target.value })}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                    >
                      <option value="">Choose patient</option>
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>{patient.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Amount (KES) *</label>
                      <input
                        required
                        type="number"
                        min="0"
                        value={newPayment.amount}
                        onChange={(event) => setNewPayment({ ...newPayment, amount: event.target.value })}
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Method *</label>
                      <select
                        value={newPayment.method}
                        onChange={(event) => setNewPayment({ ...newPayment, method: event.target.value })}
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                      >
                        <option value="Mpesa">Mpesa</option>
                        <option value="Cash">Cash</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Reference</label>
                      <input
                        value={newPayment.reference}
                        onChange={(event) => setNewPayment({ ...newPayment, reference: event.target.value })}
                        placeholder="Mpesa code or receipt"
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Paid on</label>
                      <input
                        type="date"
                        value={newPayment.paidAt}
                        onChange={(event) => setNewPayment({ ...newPayment, paidAt: event.target.value })}
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Notes</label>
                    <textarea
                      rows={3}
                      value={newPayment.notes}
                      onChange={(event) => setNewPayment({ ...newPayment, notes: event.target.value })}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                    />
                  </div>

                  <button type="submit" className="w-full rounded-[1.5rem] bg-amber-500 px-6 py-4 text-lg font-black text-white shadow-lg transition hover:bg-amber-600">
                    Save payment
                  </button>
                </form>
              </section>

              <section className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-purple-50 p-3 text-purple-600">
                    <Package2 size={22} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900">Frame inventory</h3>
                    <p className="text-sm text-gray-500">Track different frame types, stock, and price.</p>
                  </div>
                </div>

                <form onSubmit={handleAddFrame} className="mt-8 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Frame name *</label>
                      <input
                        required
                        value={newFrame.name}
                        onChange={(event) => setNewFrame({ ...newFrame, name: event.target.value })}
                        placeholder="Classic Titanium"
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Frame type *</label>
                      <input
                        required
                        list="frame-types"
                        value={newFrame.type}
                        onChange={(event) => setNewFrame({ ...newFrame, type: event.target.value })}
                        placeholder="Full Rim"
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                      />
                      <datalist id="frame-types">
                        {frameTypeOptions.map((type) => (
                          <option key={type} value={type} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Brand</label>
                      <input
                        value={newFrame.brand}
                        onChange={(event) => setNewFrame({ ...newFrame, brand: event.target.value })}
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Material</label>
                      <input
                        value={newFrame.material}
                        onChange={(event) => setNewFrame({ ...newFrame, material: event.target.value })}
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Quantity</label>
                      <input
                        type="number"
                        min="0"
                        value={newFrame.quantity}
                        onChange={(event) => setNewFrame({ ...newFrame, quantity: event.target.value })}
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Unit price (KES)</label>
                      <input
                        type="number"
                        min="0"
                        value={newFrame.unitPrice}
                        onChange={(event) => setNewFrame({ ...newFrame, unitPrice: event.target.value })}
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                      />
                    </div>
                  </div>

                  <button type="submit" className="w-full rounded-[1.5rem] bg-purple-600 px-6 py-4 text-lg font-black text-white shadow-lg transition hover:bg-purple-700">
                    Save frame item
                  </button>
                </form>
              </section>
            </div>

            <div className="grid gap-8 xl:grid-cols-2">
              <section className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
                <h3 className="text-2xl font-black text-gray-900">Recent payments</h3>
                <div className="mt-6 space-y-4">
                  {payments.length > 0 ? (
                    payments.slice(0, 8).map((payment) => {
                      const patient = patients.find((item) => item.id === payment.patientId)

                      return (
                        <div key={payment.id} className="rounded-2xl border border-gray-100 p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-black text-gray-900">{patient?.name || 'Unknown patient'}</p>
                              <p className="mt-1 text-sm text-gray-500">{payment.method} • {payment.reference || 'No reference'}</p>
                              <p className="mt-3 text-lg font-black text-amber-600">{formatCurrency(payment.amount)}</p>
                              <p className="mt-2 text-sm text-gray-500">Paid on {payment.paidAt}</p>
                            </div>
                            <button
                              onClick={() => handleDeletePayment(payment.id)}
                              className="rounded-xl p-2 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 px-5 py-12 text-center text-gray-400">
                      No payments recorded yet.
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
                <h3 className="text-2xl font-black text-gray-900">Frame stock list</h3>
                <div className="mt-6 space-y-4">
                  {frames.length > 0 ? (
                    frames.map((frame) => (
                      <div key={frame.id} className="rounded-2xl border border-gray-100 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-black text-gray-900">{frame.name}</p>
                            <p className="mt-1 text-sm text-gray-500">{frame.type} • {frame.brand || 'No brand'} {frame.material ? `• ${frame.material}` : ''}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest ${Number(frame.quantity) <= 2 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                Qty {frame.quantity}
                              </span>
                              <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-purple-700">
                                {formatCurrency(frame.unitPrice)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteFrame(frame.id)}
                            className="rounded-xl p-2 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 px-5 py-12 text-center text-gray-400">
                      No frame stock items recorded yet.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center sm:px-6 lg:flex-row lg:px-8 lg:text-left">
          <div className="flex items-center gap-3">
            <Clipboard className="text-blue-600" />
            <span className="text-lg font-black text-gray-900">OptiCare</span>
          </div>
          <div className="text-sm text-gray-500">
            <p>Role login, patient records, payment tracking, and frame inventory.</p>
            <p className="mt-1">© {new Date().getFullYear()} Clinical Management System.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-700">
            <CheckCircle2 size={16} /> Live clinic workspace
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
