import { useState, useMemo, useEffect } from 'react'
import { PlusCircle, Search, User, Clipboard, UserPlus, FileText, Trash2, Calendar, Phone, Mail, X, ArrowLeft } from 'lucide-react'
import { db } from './firebase'
import { collection, addDoc, onSnapshot, query, deleteDoc, doc, orderBy } from 'firebase/firestore'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [patients, setPatients] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  // Load Patients from Firestore
  useEffect(() => {
    const q = query(collection(db, 'patients'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const patientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setPatients(patientsData)
    }, (error) => {
      console.error("Firestore error (patients):", error)
    })
    return () => unsubscribe()
  }, [])

  // Load Prescriptions from Firestore
  useEffect(() => {
    const q = query(collection(db, 'prescriptions'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prescriptionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setPrescriptions(prescriptionsData)
    }, (error) => {
      console.error("Firestore error (prescriptions):", error)
    })
    return () => unsubscribe()
  }, [])
  const [showPatientForm, setShowPatientForm] = useState(false)
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const [viewingPatientId, setViewingPatientId] = useState(null)

  // Patient Form State
  const [newPatient, setNewPatient] = useState({ 
    name: '', dob: '', phone: '', email: '', notes: '',
    sphereL: '0.00', cylinderL: '0.00', axisL: '0',
    sphereR: '0.00', cylinderR: '0.00', axisR: '0',
    add: '0.00', frameType: '', lensType: ''
  })
  
  // Prescription Form State
  const [newPrescription, setNewPrescription] = useState({
    patientId: '',
    date: new Date().toISOString().split('T')[0],
    sphereL: '0.00', cylinderL: '0.00', axisL: '0',
    sphereR: '0.00', cylinderR: '0.00', axisR: '0',
    add: '0.00', notes: ''
  })

  // Filtered Patients
  const filteredPatients = useMemo(() => {
    return patients.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.phone.includes(searchTerm)
    )
  }, [patients, searchTerm])

  // Filtered Prescriptions
  const filteredPrescriptions = useMemo(() => {
    return prescriptions.map(pr => ({
      ...pr,
      patient: patients.find(p => p.id === pr.patientId)
    })).filter(pr => pr.patient)
  }, [prescriptions, patients])

  const handleAddPatient = async (e) => {
    e.preventDefault()
    try {
      const patientToAdd = { ...newPatient, createdAt: new Date().toISOString() }
      await addDoc(collection(db, 'patients'), patientToAdd)
      setNewPatient({
        name: '', dob: '', phone: '', email: '', notes: '',
        sphereL: '0.00', cylinderL: '0.00', axisL: '0',
        sphereR: '0.00', cylinderR: '0.00', axisR: '0',
        add: '0.00', frameType: '', lensType: ''
      })
      setShowPatientForm(false)
      setActiveTab('patients')
    } catch (error) {
      console.error("Error adding patient: ", error)
      alert("Error adding patient. Please try again.")
    }
  }

  const handleDeletePatient = async (id) => {
    if (confirm('Are you sure you want to delete this patient and all their prescriptions?')) {
      try {
        await deleteDoc(doc(db, 'patients', id))
        // Note: In a real app, you'd also delete prescriptions linked to this patient.
        // For now, let's just delete the patient.
        const linkedPrescriptions = prescriptions.filter(pr => pr.patientId === id)
        for (const pr of linkedPrescriptions) {
          await deleteDoc(doc(db, 'prescriptions', pr.id))
        }
      } catch (error) {
        console.error("Error deleting patient: ", error)
      }
    }
  }

  const handleAddPrescription = async (e) => {
    e.preventDefault()
    try {
      const prescriptionToAdd = { ...newPrescription, createdAt: new Date().toISOString() }
      await addDoc(collection(db, 'prescriptions'), prescriptionToAdd)
      setNewPrescription({
        patientId: '',
        date: new Date().toISOString().split('T')[0],
        sphereL: '0.00', cylinderL: '0.00', axisL: '0',
        sphereR: '0.00', cylinderR: '0.00', axisR: '0',
        add: '0.00', notes: ''
      })
      setShowPrescriptionForm(false)
      setActiveTab('prescriptions')
    } catch (error) {
      console.error("Error adding prescription: ", error)
      alert("Error adding prescription. Please try again.")
    }
  }

  const handleDeletePrescription = async (id) => {
    if (confirm('Are you sure you want to delete this prescription?')) {
      try {
        await deleteDoc(doc(db, 'prescriptions', id))
      } catch (error) {
        console.error("Error deleting prescription: ", error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full max-w-none p-0 overflow-x-hidden">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveTab('dashboard'); setViewingPatientId(null); setShowPatientForm(false); setShowPrescriptionForm(false); }}>
              <Clipboard className="text-blue-600 w-8 h-8" />
              <span className="text-xl font-bold text-gray-900 tracking-tight">OptiCare</span>
            </div>
            <div className="flex gap-2 sm:gap-4">
              <button
                onClick={() => { setActiveTab('dashboard'); setViewingPatientId(null); setShowPatientForm(false); setShowPrescriptionForm(false); }}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'dashboard' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => { setActiveTab('patients'); setViewingPatientId(null); setShowPatientForm(false); setShowPrescriptionForm(false); }}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'patients' && !viewingPatientId ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                Patients
              </button>
              <button
                onClick={() => { setActiveTab('prescriptions'); setViewingPatientId(null); setShowPatientForm(false); setShowPrescriptionForm(false); }}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'prescriptions' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                Prescriptions
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

        {/* DASHBOARD VIEW */}
        {activeTab === 'dashboard' && !showPatientForm && !showPrescriptionForm && !viewingPatientId && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-8 text-center sm:text-left">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Practice Dashboard</h2>
              <p className="text-gray-500 mt-1">Practice summary and key indicators</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Patients</p>
                    <p className="text-2xl font-black text-gray-900">{patients.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="bg-green-50 p-3 rounded-xl text-green-600">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Prescriptions</p>
                    <p className="text-2xl font-black text-gray-900">{prescriptions.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-50 p-3 rounded-xl text-purple-600">
                    <PlusCircle size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">New Patients (MTD)</p>
                    <p className="text-2xl font-black text-gray-900">
                      {patients.filter(p => new Date(p.createdAt).getMonth() === new Date().getMonth()).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Quick Actions */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 px-1">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => { setShowPatientForm(true); setActiveTab('patients'); }}
                    className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all flex flex-col items-center text-center gap-4 group"
                  >
                    <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
                      <UserPlus size={28} />
                    </div>
                    <span className="font-bold text-gray-800">Add New Patient</span>
                  </button>
                  <button
                    onClick={() => { setShowPrescriptionForm(true); setActiveTab('prescriptions'); }}
                    className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all flex flex-col items-center text-center gap-4 group"
                  >
                    <div className="bg-green-50 p-4 rounded-2xl text-green-600 group-hover:scale-110 transition-transform">
                      <FileText size={28} />
                    </div>
                    <span className="font-bold text-gray-800">Issue Prescription</span>
                  </button>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="relative z-10">
                    <h4 className="font-black text-2xl mb-2">Patient Records</h4>
                    <p className="text-blue-100 mb-6">You have {patients.length} registered patients. Keep records updated for optimal clinical management.</p>
                    <button
                      onClick={() => setActiveTab('patients')}
                      className="bg-white text-blue-600 px-6 py-2.5 rounded-xl font-bold transition-all hover:bg-blue-50 shadow-md"
                    >
                      Browse Database
                    </button>
                  </div>
                  <Clipboard className="absolute -right-6 -bottom-6 w-40 h-40 opacity-10 rotate-12" />
                </div>
              </div>

              {/* Recent Activity */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 px-1">Recent Enrollments</h3>
                <div className="bg-white rounded-2xl border border-gray-200 divide-y shadow-sm overflow-hidden">
                  {[...patients].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5).map(p => (
                    <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => { setViewingPatientId(p.id); setActiveTab('patients'); }}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold text-lg shadow-inner">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{p.name}</p>
                          <p className="text-xs text-gray-500 font-medium">{new Date(p.createdAt).toLocaleDateString()} • {p.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300 group-hover:text-blue-500 transition-colors">
                         <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Profile</span>
                         <ArrowLeft className="rotate-180" size={16} />
                      </div>
                    </div>
                  ))}
                  {patients.length === 0 && (
                    <div className="p-12 text-center text-gray-400 italic">
                      No patient records found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PATIENT DETAIL VIEW */}
        {viewingPatientId && (
          <div className="animate-in fade-in duration-300">
            <button
              onClick={() => setViewingPatientId(null)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors font-medium group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              Back to Patients List
            </button>
            {(() => {
              const p = patients.find(p => p.id === viewingPatientId);
              const pPresc = prescriptions.filter(pr => pr.patientId === viewingPatientId);
              if (!p) return <div className="p-20 text-center text-gray-500">Patient not found.</div>;
              return (
                <div className="space-y-8">
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 flex flex-col md:flex-row justify-between gap-8">
                    <div className="flex gap-6 items-center">
                      <div className="w-24 h-24 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-4xl shadow-inner border border-blue-200">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">{p.name}</h2>
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500 font-medium">
                          <span className="flex items-center gap-1.5"><Calendar size={14} className="text-blue-500" /> DOB: {p.dob}</span>
                          <span className="flex items-center gap-1.5"><Phone size={14} className="text-blue-500" /> {p.phone}</span>
                          {p.email && <span className="flex items-center gap-1.5"><Mail size={14} className="text-blue-500" /> {p.email}</span>}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-4">
                          {p.frameType && <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-orange-100">Frame: {p.frameType}</span>}
                          {p.lensType && <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-indigo-100">Lens: {p.lensType}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={() => {
                          setNewPrescription({...newPrescription, patientId: p.id});
                          setShowPrescriptionForm(true);
                          setViewingPatientId(null);
                          setActiveTab('prescriptions');
                        }}
                        className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                      >
                        <PlusCircle size={20} /> New Prescription
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
                      <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                         <FileText size={20} className="text-blue-600" />
                         Initial Refraction
                      </h3>
                      <div className="grid grid-cols-1 gap-6">
                        <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100/50">
                          <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Left Eye (OS)</h4>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white p-3 rounded-xl shadow-sm text-center">
                              <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Sph</p>
                              <p className="font-mono font-black text-gray-700">{p.sphereL}</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl shadow-sm text-center">
                              <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Cyl</p>
                              <p className="font-mono font-black text-gray-700">{p.cylinderL}</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl shadow-sm text-center">
                              <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Axis</p>
                              <p className="font-mono font-black text-gray-700">{p.axisL}°</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100/50">
                          <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Right Eye (OD)</h4>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white p-3 rounded-xl shadow-sm text-center">
                              <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Sph</p>
                              <p className="font-mono font-black text-gray-700">{p.sphereR}</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl shadow-sm text-center">
                              <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Cyl</p>
                              <p className="font-mono font-black text-gray-700">{p.cylinderR}</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl shadow-sm text-center">
                              <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Axis</p>
                              <p className="font-mono font-black text-gray-700">{p.axisR}°</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center px-4 py-2 bg-gray-50 rounded-xl">
                          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Addition Power</span>
                          <span className="font-mono font-black text-blue-600 text-lg">+{p.add}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
                      <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                         <User size={20} className="text-blue-600" />
                         Clinical Notes
                      </h3>
                      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 min-h-[120px]">
                        <p className="text-gray-600 italic leading-relaxed">"{p.notes || 'No clinical notes recorded for this patient.'}"</p>
                      </div>
                      <div className="mt-8 pt-8 border-t border-gray-100 space-y-4">
                         <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Frame Preference</span>
                            <span className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">{p.frameType || 'Not specified'}</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lens Preference</span>
                            <span className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">{p.lensType || 'Not specified'}</span>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <h3 className="text-xl font-black text-gray-900 mb-6 px-1">Prescription History ({pPresc.length})</h3>
                    <div className="space-y-6">
                      {pPresc.length > 0 ? (
                        pPresc.map(presc => (
                          <div key={presc.id} className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8 hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-6">
                              <p className="text-sm text-gray-500 font-bold flex items-center gap-2">
                                <Calendar size={16} className="text-blue-500" /> Issued on {new Date(presc.date).toLocaleDateString()}
                              </p>
                              <button onClick={() => handleDeletePrescription(presc.id)} className="text-red-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                               <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Left Eye (OS)</h4>
                                 <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-white p-3 rounded-xl shadow-sm text-center">
                                      <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Sph</p>
                                      <p className="font-mono font-black text-gray-700">{presc.sphereL}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl shadow-sm text-center">
                                      <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Cyl</p>
                                      <p className="font-mono font-black text-gray-700">{presc.cylinderL}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl shadow-sm text-center">
                                      <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Axis</p>
                                      <p className="font-mono font-black text-gray-700">{presc.axisL}°</p>
                                    </div>
                                 </div>
                               </div>
                               <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Right Eye (OD)</h4>
                                 <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-white p-3 rounded-xl shadow-sm text-center">
                                      <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Sph</p>
                                      <p className="font-mono font-black text-gray-700">{presc.sphereR}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl shadow-sm text-center">
                                      <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Cyl</p>
                                      <p className="font-mono font-black text-gray-700">{presc.cylinderR}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl shadow-sm text-center">
                                      <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Axis</p>
                                      <p className="font-mono font-black text-gray-700">{presc.axisR}°</p>
                                    </div>
                                 </div>
                               </div>
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-t border-gray-100 pt-6 gap-4">
                              <div className="bg-blue-50 px-4 py-2 rounded-xl">
                                <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Add Power</p>
                                <p className="font-mono font-black text-blue-600 text-lg">+{presc.add}</p>
                              </div>
                              {presc.notes && (
                                <div className="flex-1 max-w-md text-left sm:text-right">
                                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Dispensing Notes</p>
                                  <p className="text-sm text-gray-600 italic">"{presc.notes}"</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-16 bg-white rounded-3xl border border-dashed border-gray-200 text-center text-gray-400 italic">
                           No prescription records found for this patient.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* PATIENTS TAB */}
        {activeTab === 'patients' && !showPatientForm && !showPrescriptionForm && !viewingPatientId && (
          <div className="animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Patient Database</h2>
                <p className="text-gray-500 mt-1">Manage patient records and clinical history</p>
              </div>
              <button 
                onClick={() => setShowPatientForm(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95"
              >
                <UserPlus size={20} strokeWidth={2.5} />
                New Patient
              </button>
            </div>
            
            <div className="relative mb-8 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Search by name, phone or ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white shadow-sm text-lg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatients.length > 0 ? (
                filteredPatients.map(patient => (
                  <div key={patient.id} onClick={() => setViewingPatientId(patient.id)} className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:border-blue-100 transition-all group cursor-pointer active:scale-[0.98]">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-2xl shadow-inner border border-blue-50">
                        {patient.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewPrescription({...newPrescription, patientId: patient.id});
                            setShowPrescriptionForm(true);
                            setActiveTab('prescriptions');
                          }}
                          title="New Prescription"
                          className="p-2.5 text-green-600 hover:bg-green-50 rounded-xl transition-all"
                        >
                          <PlusCircle size={20} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePatient(patient.id);
                          }}
                          title="Delete Record"
                          className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{patient.name}</h3>
                    <div className="space-y-2.5 text-sm text-gray-500 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-blue-400" />
                        <span>DOB: {patient.dob}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-blue-400" />
                        <span>{patient.phone}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-50">
                          {patient.frameType && <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-orange-100">Frame: {patient.frameType}</span>}
                          {patient.lensType && <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">Lens: {patient.lensType}</span>}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-24 bg-white rounded-3xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                   <div className="bg-gray-50 p-6 rounded-full mb-4">
                     <User className="w-12 h-12 opacity-20" />
                   </div>
                   <p className="text-xl font-bold text-gray-900 mb-1">No patient records found</p>
                   <p className="text-sm">Start by adding your first patient to the database</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PATIENT FORM */}
        {showPatientForm && (
          <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-6 duration-500">
            <button 
              onClick={() => setShowPatientForm(false)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors font-bold group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              Back to Database
            </button>
            <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-8 sm:p-12">
              <div className="mb-10">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Add New Patient</h2>
                <p className="text-gray-500 mt-2">Complete all required fields to create a clinical record</p>
              </div>

              <form onSubmit={handleAddPatient} className="space-y-10">
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                    <User size={16} /> Personal Information
                  </h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Full Name *</label>
                      <input 
                        required
                        type="text" 
                        value={newPatient.name}
                        onChange={e => setNewPatient({...newPatient, name: e.target.value})}
                        placeholder="e.g. John Alexander Doe"
                        className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-gray-50/50"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Date of Birth *</label>
                        <input 
                          required
                          type="date" 
                          value={newPatient.dob}
                          onChange={e => setNewPatient({...newPatient, dob: e.target.value})}
                          className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-gray-50/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Phone Number *</label>
                        <input 
                          required
                          type="tel" 
                          value={newPatient.phone}
                          onChange={e => setNewPatient({...newPatient, phone: e.target.value})}
                          placeholder="e.g. +1 (555) 000-0000"
                          className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-gray-50/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                      <input 
                        type="email" 
                        value={newPatient.email}
                        onChange={e => setNewPatient({...newPatient, email: e.target.value})}
                        placeholder="john.doe@clinical.com"
                        className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-gray-50/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-10 border-t border-gray-100">
                  <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={16} /> Initial Eye Measures (Refraction)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Left Eye */}
                    <div className="space-y-5">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Left Eye (OS)</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 mb-1 uppercase">SPH</label>
                          <input type="text" value={newPatient.sphereL} onChange={e => setNewPatient({...newPatient, sphereL: e.target.value})} className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-center shadow-inner" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 mb-1 uppercase">CYL</label>
                          <input type="text" value={newPatient.cylinderL} onChange={e => setNewPatient({...newPatient, cylinderL: e.target.value})} className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-center shadow-inner" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 mb-1 uppercase">AXIS</label>
                          <input type="text" value={newPatient.axisL} onChange={e => setNewPatient({...newPatient, axisL: e.target.value})} className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-center shadow-inner" />
                        </div>
                      </div>
                    </div>

                    {/* Right Eye */}
                    <div className="space-y-5">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Right Eye (OD)</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 mb-1 uppercase">SPH</label>
                          <input type="text" value={newPatient.sphereR} onChange={e => setNewPatient({...newPatient, sphereR: e.target.value})} className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-center shadow-inner" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 mb-1 uppercase">CYL</label>
                          <input type="text" value={newPatient.cylinderR} onChange={e => setNewPatient({...newPatient, cylinderR: e.target.value})} className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-center shadow-inner" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 mb-1 uppercase">AXIS</label>
                          <input type="text" value={newPatient.axisR} onChange={e => setNewPatient({...newPatient, axisR: e.target.value})} className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-center shadow-inner" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Addition Power (ADD)</label>
                      <input type="text" value={newPatient.add} onChange={e => setNewPatient({...newPatient, add: e.target.value})} className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-mono shadow-inner" placeholder="+0.00" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-10 border-t border-gray-100">
                  <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                    <Clipboard size={16} /> Dispensing Preferences
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Frame Type / Material</label>
                      <input 
                        type="text" 
                        value={newPatient.frameType}
                        onChange={e => setNewPatient({...newPatient, frameType: e.target.value})}
                        placeholder="e.g. Titanium Rimless"
                        className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Lens Type / Coating</label>
                      <input 
                        type="text" 
                        value={newPatient.lensType}
                        onChange={e => setNewPatient({...newPatient, lensType: e.target.value})}
                        placeholder="e.g. Progressive Blue-Cut"
                        className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Clinical Notes & Observations</label>
                    <textarea 
                      rows={4}
                      value={newPatient.notes}
                      onChange={e => setNewPatient({...newPatient, notes: e.target.value})}
                      placeholder="Enter any specific clinical observations, previous history or allergies..."
                      className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50/50 resize-none"
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xl hover:bg-blue-700 transition-all shadow-xl hover:shadow-blue-500/20 active:scale-[0.98]"
                  >
                    Register Patient Record
                  </button>
                  <p className="text-center text-gray-400 text-xs mt-6 uppercase tracking-widest font-bold">Confidential Medical Record</p>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PRESCRIPTIONS TAB */}
        {activeTab === 'prescriptions' && !showPrescriptionForm && (
          <div className="animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Prescription Records</h2>
                <p className="text-gray-500 mt-1">Review and manage clinical prescriptions</p>
              </div>
              <button 
                onClick={() => setShowPrescriptionForm(true)}
                disabled={patients.length === 0}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusCircle size={20} strokeWidth={2.5} />
                New Prescription
              </button>
            </div>

            <div className="space-y-6">
              {filteredPrescriptions.length > 0 ? (
                filteredPrescriptions.map(presc => (
                  <div key={presc.id} className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-all">
                    <div className="p-6 sm:p-10">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">
                        <div>
                          <h3 className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">{presc.patient?.name}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-2 mt-2 font-bold uppercase tracking-widest">
                            <Calendar size={14} className="text-blue-500" /> Issued on {new Date(presc.date).toLocaleDateString()}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleDeletePrescription(presc.id)}
                          className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={24} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-5">Left Eye (OS)</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
                              <p className="text-[8px] font-black text-gray-400 uppercase mb-2">Sphere</p>
                              <p className="text-xl font-mono font-black text-gray-800">{presc.sphereL}</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
                              <p className="text-[8px] font-black text-gray-400 uppercase mb-2">Cylinder</p>
                              <p className="text-xl font-mono font-black text-gray-800">{presc.cylinderL}</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
                              <p className="text-[8px] font-black text-gray-400 uppercase mb-2">Axis</p>
                              <p className="text-xl font-mono font-black text-gray-800">{presc.axisL}°</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-5">Right Eye (OD)</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
                              <p className="text-[8px] font-black text-gray-400 uppercase mb-2">Sphere</p>
                              <p className="text-xl font-mono font-black text-gray-800">{presc.sphereR}</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
                              <p className="text-[8px] font-black text-gray-400 uppercase mb-2">Cylinder</p>
                              <p className="text-xl font-mono font-black text-gray-800">{presc.cylinderR}</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
                              <p className="text-[8px] font-black text-gray-400 uppercase mb-2">Axis</p>
                              <p className="text-xl font-mono font-black text-gray-800">{presc.axisR}°</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-10 items-start sm:items-center pt-8 border-t border-gray-100">
                        <div className="bg-blue-50 px-6 py-4 rounded-2xl">
                          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Add Power</p>
                          <p className="text-2xl font-mono font-black text-blue-600">+{presc.add}</p>
                        </div>
                        {presc.notes && (
                          <div className="flex-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Special Dispensing Instructions</p>
                            <p className="text-gray-600 italic leading-relaxed">"{presc.notes}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-24 bg-white rounded-3xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 italic">
                   <FileText className="w-16 h-16 mb-4 opacity-10" />
                   <p className="text-xl font-bold text-gray-900 mb-1">No prescriptions recorded yet</p>
                   {patients.length === 0 && <p className="text-sm">Register a patient first to start creating prescriptions</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PRESCRIPTION FORM */}
        {showPrescriptionForm && (
          <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-6 duration-500">
            <button 
              onClick={() => setShowPrescriptionForm(false)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors font-black group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              Back to Records
            </button>
            <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-8 sm:p-12">
              <div className="mb-10 text-center sm:text-left">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">New Clinical Prescription</h2>
                <p className="text-gray-500 mt-2">Enter clinical refraction data and dispensing requirements</p>
              </div>
              
              <form onSubmit={handleAddPrescription} className="space-y-10">
                <div className="space-y-6">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Selected Patient *</label>
                  <select 
                    required
                    value={newPrescription.patientId}
                    onChange={e => setNewPrescription({...newPrescription, patientId: e.target.value})}
                    className="w-full px-6 py-5 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none bg-gray-50/50 transition-all font-bold text-gray-700"
                  >
                    <option value="">Select a patient from database...</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Born {p.dob})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-8 pt-6 border-t border-gray-100">
                   <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                     <FileText size={16} /> Refraction Analysis
                   </h3>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {/* Left Eye */}
                      <div className="space-y-5">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Left Eye (OS)</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase">SPH</label>
                            <input type="text" value={newPrescription.sphereL} onChange={e => setNewPrescription({...newPrescription, sphereL: e.target.value})} className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-center shadow-inner text-lg font-bold" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase">CYL</label>
                            <input type="text" value={newPrescription.cylinderL} onChange={e => setNewPrescription({...newPrescription, cylinderL: e.target.value})} className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-center shadow-inner text-lg font-bold" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase">AXIS</label>
                            <input type="text" value={newPrescription.axisL} onChange={e => setNewPrescription({...newPrescription, axisL: e.target.value})} className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-center shadow-inner text-lg font-bold" />
                          </div>
                        </div>
                      </div>

                      {/* Right Eye */}
                      <div className="space-y-5">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Right Eye (OD)</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase">SPH</label>
                            <input type="text" value={newPrescription.sphereR} onChange={e => setNewPrescription({...newPrescription, sphereR: e.target.value})} className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-center shadow-inner text-lg font-bold" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase">CYL</label>
                            <input type="text" value={newPrescription.cylinderR} onChange={e => setNewPrescription({...newPrescription, cylinderR: e.target.value})} className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-center shadow-inner text-lg font-bold" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase">AXIS</label>
                            <input type="text" value={newPrescription.axisR} onChange={e => setNewPrescription({...newPrescription, axisR: e.target.value})} className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-center shadow-inner text-lg font-bold" />
                          </div>
                        </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Addition Power (ADD)</label>
                        <input type="text" value={newPrescription.add} onChange={e => setNewPrescription({...newPrescription, add: e.target.value})} className="w-full px-6 py-5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-mono shadow-inner text-xl font-black text-blue-600" placeholder="+0.00" />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Examination Date</label>
                        <input required type="date" value={newPrescription.date} onChange={e => setNewPrescription({...newPrescription, date: e.target.value})} className="w-full px-6 py-5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/50" />
                      </div>
                   </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-gray-100">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Dispensing Notes & Instructions</label>
                  <textarea 
                    rows={4}
                    value={newPrescription.notes}
                    onChange={e => setNewPrescription({...newPrescription, notes: e.target.value})}
                    placeholder="Enter lens specifications, coatings, frame adjustments or any specific instructions for the lab..."
                    className="w-full px-6 py-5 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-gray-50/50 resize-none font-medium"
                  />
                </div>
                
                <div className="pt-6">
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-xl hover:bg-blue-700 transition-all shadow-xl hover:shadow-blue-500/20 active:scale-[0.98]"
                  >
                    Authorize & Save Prescription
                  </button>
                  <p className="text-center text-gray-400 text-xs mt-6 uppercase tracking-widest font-bold">Clinical Authorization Required</p>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-10 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
             <Clipboard className="text-blue-600 w-6 h-6" />
             <span className="text-lg font-black text-gray-900 tracking-tight">OptiCare</span>
          </div>
          <p className="text-gray-400 text-sm font-medium">
            &copy; {new Date().getFullYear()} Clinical Management System. Professional Edition.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
