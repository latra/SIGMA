'use client'

import { useState } from 'react'
import Navbar from "../components/navbar"
import DoctorRoute from "../components/DoctorRoute"
import PatientsTable from "../components/patients-table"
import PatientDetails from "../components/patient-details"
import RegisterPatient from "../components/register-patient"
import DeleteConfirmation from "../components/delete-confirmation"
import { deletePatient, PatientSummary } from "../../lib/api"

export default function Patients() {
  const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [patientToDelete, setPatientToDelete] = useState<PatientSummary | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handlePatientDetails = (patient: PatientSummary) => {
    console.log('handlePatientDetails called:', patient.name)
    setSelectedPatient(patient)
    setIsDetailsOpen(true)
  }

  const handleCloseDetails = () => {
    console.log('handleCloseDetails called')
    setIsDetailsOpen(false)
    setSelectedPatient(null)
  }

  const handleOpenRegister = () => {
    setIsRegisterOpen(true)
  }

  const handleCloseRegister = () => {
    setIsRegisterOpen(false)
  }

  const handlePatientCreated = () => {
    // Trigger a refresh of the patients table
    setRefreshTrigger(prev => prev + 1)
  }

  const handlePatientUpdated = (updatedPatient: PatientSummary) => {
    // Update the selected patient with the new data
    setSelectedPatient(updatedPatient)
    // Trigger a refresh of the patients table
    setRefreshTrigger(prev => prev + 1)
  }

  const handlePatientDelete = async (patient: PatientSummary) => {
    try {
      await deletePatient(patient.dni)
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error deleting patient:', error)
      throw error // Re-throw to be handled by the confirmation component
    }
  }

  const handleOpenDelete = (patient: PatientSummary) => {
    setPatientToDelete(patient)
    setIsDeleteOpen(true)
  }

  const handleCloseDelete = () => {
    setIsDeleteOpen(false)
    setPatientToDelete(null)
  }

  const handleDeleteConfirm = async () => {
    if (!patientToDelete) return

    try {
      await handlePatientDelete(patientToDelete)
      handleCloseDelete()
    } catch (error) {
      console.error('Error deleting patient:', error)
      throw error // Re-throw to be handled by the confirmation component
    }
  }

  return (
    <DoctorRoute>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Pacientes</h1>
              <p className="text-gray-600">Visualiza y administra la información de los pacientes</p>
            </div>
            <button
              onClick={handleOpenRegister}
              className="bg-hospital-blue hover:bg-hospital-blue/80 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              + Registrar Nuevo Paciente
            </button>
          </div>

          <PatientsTable 
            onPatientDetails={handlePatientDetails}
            refreshTrigger={refreshTrigger}
            onPatientDelete={handleOpenDelete}
          />

          {/* Patient Details Modal */}
          <PatientDetails
            patient={selectedPatient}
            isOpen={isDetailsOpen}
            onClose={handleCloseDetails}
            onPatientUpdate={handlePatientUpdated}
          />

          {/* Register Patient Modal */}
          <RegisterPatient
            isOpen={isRegisterOpen}
            onClose={handleCloseRegister}
            onPatientCreated={handlePatientCreated}
          />

          {/* Delete Confirmation Modal */}
          <DeleteConfirmation
            patient={patientToDelete}
            isOpen={isDeleteOpen}
            onClose={handleCloseDelete}
            onConfirm={handlePatientDelete}
          />
        </div>
      </div>
    </DoctorRoute>
  )
}