import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Trash2, Edit, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Contact } from '../types'

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContacts()
  }, [])

  async function fetchContacts() {
    setLoading(true)
    const { data, error } = await supabase.from('contacts').select('*').order('name')
    if (data) setContacts(data)
    if (error) console.error('Error fetching contacts:', error)
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (window.confirm('¿Estás seguro de que quieres eliminar este contacto?')) {
      const { error } = await supabase.from('contacts').delete().eq('id', id)
      if (error) {
        alert(`Error: ${error.message}`)
      } else {
        setContacts(prev => prev.filter(c => c.id !== id))
      }
    }
  }

  if (loading) {
    return <div>Cargando contactos...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Contactos</h1>
        <Link to="/admin/contactos/nuevo" className="btn-primary">
          <PlusCircle className="h-5 w-5 mr-2" />
          Añadir Contacto
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg">
        <ul role="list" className="divide-y divide-gray-200">
          {contacts.map((contact) => (
            <li key={contact.id} className="flex justify-between items-center gap-x-6 p-5">
              <div className="flex items-center min-w-0 gap-x-4">
                <div className="h-10 w-10 flex-none rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm font-semibold leading-6 text-gray-900">{contact.name}</p>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/admin/contactos/editar/${contact.id}`}
                  className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-50"
                  title="Editar"
                >
                  <Edit className="h-5 w-5" />
                </Link>
                <button onClick={() => handleDelete(contact.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-50" title="Eliminar">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}