import { useState, useMemo } from 'react'
import { PlusCircle, Search, User, Clipboard, UserPlus, FileText, Trash2, Calendar, Phone, Mail, X, ArrowLeft } from 'lucide-react'
import { useLocalStorage } from './useLocalStorage'

function App() {
  const [activeTab, setActiveTab] = useState('patients')
  const [patients, setPatients] = useLocalStorage('opticare-patients', [])
  const [prescriptions, setPrescriptions] = useLocalStorage('opticare-prescriptions', [])
  const [searchTerm, setSearchTerm] = useState('')
  const [showPatientForm, setShowPatientForm] = useState(false)
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const [viewingPatientId, setViewingPatientId] = useState(null)

  // Patient Form State
  const [newPatient, setNewPatient] = useState({ name: '', dob: '', phone: '', email: '', notes: '' })
  
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

  const handleAddPatient = (e) => {
    e.preventDefault()
    const patientToAdd = { ...newPatient, id: Date.now().toString() }
    setPatients([...patients, patientToAdd])
    setNewPatient({ name: '', dob: '', phone: '', email: '', notes: '' })
    setShowPatientForm(false)
  }

  const handleDeletePatient = (id) => {
    if (confirm('Are you sure you want to delete this patient and all their prescriptions?')) {
      setPatients(patients.filter(p => p.id !== id))
      setPrescriptions(prescriptions.filter(pr => pr.patientId !== id))
    }
  }

  const handleAddPrescription = (e) => {
    e.preventDefault()
    const prescriptionToAdd = { ...newPrescription, id: Date.now().toString() }
    setPrescriptions([...prescriptions, prescriptionToAdd])
    setNewPrescription({
      patientId: '',
      date: new Date().toISOString().split('T')[0],
      sphereL: '0.00', cylinderL: '0.00', axisL: '0',
      sphereR: '0.00', cylinderR: '0.00', axisR: '0',
      add: '0.00', notes: ''
    })
    setShowPrescriptionForm(false)
    setActiveTab('prescriptions')
  }

  const handleDeletePrescription = (id) => {
    if (confirm('Are you sure you want to delete this prescription?')) {
      setPrescriptions(prescriptions.filter(pr => pr.id !== id))
    }
  }

  const getPatientName = (id) => patients.find(p => p.id === id)?.name || 'Unknown'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full max-w-none p-0 overflow-x-hidden">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('patients')}>
              <Clipboard className="text-blue-600 w-8 h-8" />
              <span className="text-xl font-bold text-gray-900 tracking-tight">OptiCare</span>
            </div>
            <div className="flex gap-2 sm:gap-4">
              <button
                onClick={() => { setActiveTab('patients'); setViewingPatientId(null); }}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'patients' && !viewingPatientId ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                Patients
              </button>
              <button
                onClick={() => { setActiveTab('prescriptions'); setViewingPatientId(null); }}
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

        {/* PATIENT DETAIL VIEW */}
        {viewingPatientId && (
          <div className="animate-in fade-in duration-300">
            <button
              onClick={() => setViewingPatientId(null)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors font-medium"
            >
              <ArrowLeft size={18} />
              Back to List
            </button>
            {(() => {
              const p = patients.find(p => p.id === viewingPatientId);
              const pPresc = prescriptions.filter(pr => pr.patientId === viewingPatientId);
              if (!p) return <div>Patient not found.</div>;
              return (
                <div className="space-y-8">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col md:flex-row justify-between gap-8">
                    <div className="flex gap-6 items-center">
                      <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-3xl shadow-inner">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-gray-900">{p.name}</h2>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500 font-medium">
                          <span className="flex items-center gap-1.5"><Calendar size={14} /> DOB: {p.dob}</span>
                          <span className="flex items-center gap-1.5"><Phone size={14} /> {p.phone}</span>
                          {p.email && <span className="flex items-center gap-1.5"><Mail size={14} /> {p.email}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setNewPrescription({...newPrescription, patientId: p.id});
                          setShowPrescriptionForm(true);
                          setViewingPatientId(null);
                        }}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95 flex items-center gap-2"
                      >
                        <PlusCircle size={18} /> New Prescription
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-gray-900 mb-6">Prescription History ({pPresc.length})</h3>
                    <div className="space-y-6">
                      {pPresc.length > 0 ? (
                        pPresc.map(presc => (
                          <div key={presc.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                            <div className="flex justify-between items-start mb-6">
                              <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                <Calendar size={14} /> Issued on {presc.date}
                              </p>
                              <button onClick={() => handleDeletePrescription(presc.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18} /></button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                               <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50">
                                 <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Left Eye (OS)</h4>
                                 <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-white p-2 rounded shadow-sm text-center">
                                      <p className="text-[8px] text-gray-400 uppercase">Sph</p>
                                      <p className="font-mono font-bold text-gray-700">{presc.sphereL}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded shadow-sm text-center">
                                      <p className="text-[8px] text-gray-400 uppercase">Cyl</p>
                                      <p className="font-mono font-bold text-gray-700">{presc.cylinderL}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded shadow-sm text-center">
                                      <p className="text-[8px] text-gray-400 uppercase">Axis</p>
                                      <p className="font-mono font-bold text-gray-700">{presc.axisL}°</p>
                                    </div>
                                 </div>
                               </div>
                               <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50">
                                 <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Right Eye (OD)</h4>
                                 <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-white p-2 rounded shadow-sm text-center">
                                      <p className="text-[8px] text-gray-400 uppercase">Sph</p>
                                      <p className="font-mono font-bold text-gray-700">{presc.sphereR}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded shadow-sm text-center">
                                      <p className="text-[8px] text-gray-400 uppercase">Cyl</p>
                                      <p className="font-mono font-bold text-gray-700">{presc.cylinderR}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded shadow-sm text-center">
                                      <p className="text-[8px] text-gray-400 uppercase">Axis</p>
                                      <p className="font-mono font-bold text-gray-700">{presc.axisR}°</p>
                                    </div>
                                 </div>
                               </div>
                            </div>
                            <div className="flex justify-between items-end border-t border-gray-50 pt-4">
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase mb-1">ADD</p>
                                <p className="font-mono font-black text-blue-600">+{presc.add}</p>
                              </div>
                              {presc.notes && <p className="text-sm text-gray-500 italic max-w-md text-right">"{presc.notes}"</p>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-12 bg-white rounded-2xl border border-dashed border-gray-200 text-center text-gray-400">
                           No prescriptions for this patient.
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
        {activeTab === 'patients' && !showPatientForm && !viewingPatientId && (
          <div className="animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900">Patient Database</h2>
                <p className="text-gray-500 mt-1">Manage patient records and clinical history</p>
              </div>
              <button 
                onClick={() => setShowPatientForm(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
              >
                <UserPlus size={20} strokeWidth={2.5} />
                New Patient
              </button>
            </div>
            
            <div className="relative mb-8 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Search by name or phone..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white shadow-sm text-lg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatients.length > 0 ? (
                filteredPatients.map(patient => (
                  <div key={patient.id} onClick={() => setViewingPatientId(patient.id)} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group cursor-pointer active:scale-[0.98]">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                        {patient.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewPrescription({...newPrescription, patientId: patient.id});
                            setShowPrescriptionForm(true);
                          }}
                          title="Add Prescription"
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <PlusCircle size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePatient(patient.id);
                          }}
                          title="Delete Patient"
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{patient.name}</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span>DOB: {patient.dob}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-gray-400" />
                        <span>{patient.phone}</span>
                      </div>
                      {patient.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-gray-400" />
                          <span className="truncate">{patient.email}</span>
                        </div>
                      )}
                    </div>
                    {patient.notes && (
                      <div className="mt-4 pt-4 border-t border-gray-50">
                        <p className="text-sm text-gray-500 italic line-clamp-2">"{patient.notes}"</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 bg-white rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                   <User className="w-12 h-12 mb-4 opacity-20" />
                   <p className="text-lg font-medium">No patient records found</p>
                   {searchTerm && <p className="text-sm">Try clearing your search query</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PATIENT FORM */}
        {showPatientForm && (
          <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-300">
            <button 
              onClick={() => setShowPatientForm(false)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors font-medium"
            >
              <ArrowLeft size={18} />
              Back to Patients
            </button>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-8">Add New Patient</h2>
              <form onSubmit={handleAddPatient} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Full Name *</label>
                  <input 
                    required
                    type="text" 
                    value={newPatient.name}
                    onChange={e => setNewPatient({...newPatient, name: e.target.value})}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Date of Birth *</label>
                    <input 
                      required
                      type="date" 
                      value={newPatient.dob}
                      onChange={e => setNewPatient({...newPatient, dob: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number *</label>
                    <input 
                      required
                      type="tel" 
                      value={newPatient.phone}
                      onChange={e => setNewPatient({...newPatient, phone: e.target.value})}
                      placeholder="e.g. +1 (555) 000-0000"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    value={newPatient.email}
                    onChange={e => setNewPatient({...newPatient, email: e.target.value})}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Clinical Notes</label>
                  <textarea 
                    rows={3}
                    value={newPatient.notes}
                    onChange={e => setNewPatient({...newPatient, notes: e.target.value})}
                    placeholder="Allergies, previous conditions, etc."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg active:scale-[0.98]"
                >
                  Create Patient Record
                </button>
              </form>
            </div>
          </div>
        )}

        {/* PRESCRIPTIONS TAB */}
        {activeTab === 'prescriptions' && !showPrescriptionForm && (
          <div className="animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900">Prescription Records</h2>
                <p className="text-gray-500 mt-1">Review and manage clinical prescriptions</p>
              </div>
              <button 
                onClick={() => setShowPrescriptionForm(true)}
                disabled={patients.length === 0}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusCircle size={20} strokeWidth={2.5} />
                New Prescription
              </button>
            </div>

            <div className="space-y-6">
              {filteredPrescriptions.length > 0 ? (
                filteredPrescriptions.map(presc => (
                  <div key={presc.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden group">
                    <div className="p-6 sm:p-8">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-xl font-black text-gray-900">{presc.patient?.name}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <Calendar size={14} /> Issued on {presc.date}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleDeletePrescription(presc.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                          <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Left Eye (OS)</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">Sphere</p>
                              <p className="text-xl font-mono font-bold text-gray-800">{presc.sphereL}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">Cylinder</p>
                              <p className="text-xl font-mono font-bold text-gray-800">{presc.cylinderL}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">Axis</p>
                              <p className="text-xl font-mono font-bold text-gray-800">{presc.axisL}°</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                          <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Right Eye (OD)</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">Sphere</p>
                              <p className="text-xl font-mono font-bold text-gray-800">{presc.sphereR}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">Cylinder</p>
                              <p className="text-xl font-mono font-bold text-gray-800">{presc.cylinderR}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">Axis</p>
                              <p className="text-xl font-mono font-bold text-gray-800">{presc.axisR}°</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center pt-6 border-t border-gray-100">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">ADD Power</p>
                          <p className="text-xl font-mono font-bold text-blue-600">+{presc.add}</p>
                        </div>
                        {presc.notes && (
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">Special Instructions</p>
                            <p className="text-sm text-gray-600">{presc.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 bg-white rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                   <FileText className="w-12 h-12 mb-4 opacity-20" />
                   <p className="text-lg font-medium">No prescriptions recorded</p>
                   {patients.length === 0 && <p className="text-sm">Register a patient first to create prescriptions</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PRESCRIPTION FORM */}
        {showPrescriptionForm && (
          <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-300">
            <button 
              onClick={() => setShowPrescriptionForm(false)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors font-medium"
            >
              <ArrowLeft size={18} />
              Back to Records
            </button>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-8">New Clinical Prescription</h2>
              <form onSubmit={handleAddPrescription} className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Select Patient *</label>
                  <select 
                    required
                    value={newPrescription.patientId}
                    onChange={e => setNewPrescription({...newPrescription, patientId: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="">Choose a patient...</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.dob})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-6">
                   <h3 className="font-bold text-gray-900 border-b pb-2">Refraction Data</h3>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left Eye */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-black text-blue-600 uppercase tracking-wider">Left Eye (OS)</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 mb-1 uppercase">SPH</label>
                            <input type="text" value={newPrescription.sphereL} onChange={e => setNewPrescription({...newPrescription, sphereL: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none font-mono" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 mb-1 uppercase">CYL</label>
                            <input type="text" value={newPrescription.cylinderL} onChange={e => setNewPrescription({...newPrescription, cylinderL: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none font-mono" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 mb-1 uppercase">AXIS</label>
                            <input type="text" value={newPrescription.axisL} onChange={e => setNewPrescription({...newPrescription, axisL: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none font-mono" />
                          </div>
                        </div>
                      </div>

                      {/* Right Eye */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-black text-blue-600 uppercase tracking-wider">Right Eye (OD)</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 mb-1 uppercase">SPH</label>
                            <input type="text" value={newPrescription.sphereR} onChange={e => setNewPrescription({...newPrescription, sphereR: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none font-mono" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 mb-1 uppercase">CYL</label>
                            <input type="text" value={newPrescription.cylinderR} onChange={e => setNewPrescription({...newPrescription, cylinderR: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none font-mono" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 mb-1 uppercase">AXIS</label>
                            <input type="text" value={newPrescription.axisR} onChange={e => setNewPrescription({...newPrescription, axisR: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none font-mono" />
                          </div>
                        </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">ADD Power</label>
                        <input type="text" value={newPrescription.add} onChange={e => setNewPrescription({...newPrescription, add: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono" placeholder="+0.00" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Examination Date</label>
                        <input required type="date" value={newPrescription.date} onChange={e => setNewPrescription({...newPrescription, date: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                   </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Instructions / Dispensing Notes</label>
                  <textarea 
                    rows={3}
                    value={newPrescription.notes}
                    onChange={e => setNewPrescription({...newPrescription, notes: e.target.value})}
                    placeholder="Lens type, coating, frame details, etc."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg active:scale-[0.98]"
                >
                  Save Prescription
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} OptiCare Clinical Management System. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

export default App
