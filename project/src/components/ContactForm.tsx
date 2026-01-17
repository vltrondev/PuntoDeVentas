import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Contact } from '../types';

export default function ContactForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Partial<Contact>>({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing) {
      const fetchContact = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase.from('contacts').select('*').eq('id', id).single();
          if (error) throw error;
          if (data) setContact(data);
        } catch (error) {
          console.error("Error fetching contact:", error);
          alert('Error al cargar el contacto.');
        } finally {
          setLoading(false);
        }
      };
      fetchContact();
    }
  }, [id, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContact(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const contactData = {
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      address: contact.address,
    };

    let error;
    if (isEditing) {
      ({ error } = await supabase.from('contacts').update(contactData).eq('id', id).select());
    } else {
      ({ error } = await supabase.from('contacts').insert(contactData).select());
    }

    setLoading(false);
    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      alert(`Contacto ${isEditing ? 'actualizado' : 'creado'} con éxito!`);
      navigate('/admin/contactos');
    }
  };

  if (loading && isEditing) return <div>Cargando contacto...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{isEditing ? 'Editar Contacto' : 'Nuevo Contacto'}</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
          <input type="text" name="name" id="name" value={contact.name} onChange={handleChange} className="input-field mt-1" required />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
          <input type="email" name="email" id="email" value={contact.email || ''} onChange={handleChange} className="input-field mt-1" />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Teléfono</label>
          <input type="tel" name="phone" id="phone" value={contact.phone || ''} onChange={handleChange} className="input-field mt-1" />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">Dirección</label>
          <textarea name="address" id="address" value={contact.address || ''} onChange={handleChange} rows={3} className="input-field mt-1"></textarea>
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary mr-4">Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Contacto'}
          </button>
        </div>
      </form>
    </div>
  );
}