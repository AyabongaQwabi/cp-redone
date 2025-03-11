'use client';

import Link from 'next/link';

import type React from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase-client';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import type { Company } from '@/app/types';

export default function CreateAppointment() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [formData, setFormData] = useState({
    companyId: '',
    clinicName: '',
    appointmentType: '',
    date: '',
    time: '',
    patientName: '',
    patientContact: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const user = auth.currentUser;
        if (!user) {
          router.push('/login');
          return;
        }

        const companiesQuery = query(
          collection(db, 'companies'),
          where('userId', '==', user.uid)
        );
        const companiesSnapshot = await getDocs(companiesQuery);
        const companiesData = companiesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Company[];

        setCompanies(companiesData);
      } catch (error) {
        console.error('Error fetching companies:', error);
        setError('Failed to load companies');
      }
    }

    fetchCompanies();
  }, [router]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to create an appointment');
      }

      // Create appointment in Firestore
      await addDoc(collection(db, 'appointments'), {
        ...formData,
        userId: user.uid,
        status: 'Pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating appointment:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6'>Create Appointment</h1>

      {error && (
        <div className='mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
          {error}
        </div>
      )}

      {companies.length === 0 ? (
        <div className='bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded mb-6'>
          <p>You need to create a company before booking an appointment.</p>
          <Link
            href='/dashboard/create-company'
            className='text-blue-500 hover:underline mt-2 inline-block'
          >
            Create a company
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className='bg-white shadow-md rounded-lg p-6 max-w-lg mx-auto'
        >
          <div className='mb-4'>
            <label
              htmlFor='companyId'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Company
            </label>
            <select
              id='companyId'
              name='companyId'
              value={formData.companyId}
              onChange={handleInputChange}
              required
              className='w-full px-3 py-2 border text-gray-400 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500'
            >
              <option value=''>Select a company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div className='mb-4'>
            <label
              htmlFor='clinicName'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Clinic Name
            </label>
            <input
              type='text'
              id='clinicName'
              name='clinicName'
              value={formData.clinicName}
              onChange={handleInputChange}
              required
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500'
            />
          </div>

          <div className='mb-4'>
            <label
              htmlFor='appointmentType'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Appointment Type
            </label>
            <input
              type='text'
              id='appointmentType'
              name='appointmentType'
              value={formData.appointmentType}
              onChange={handleInputChange}
              required
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500'
            />
          </div>

          <div className='mb-4'>
            <label
              htmlFor='date'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Date
            </label>
            <input
              type='date'
              id='date'
              name='date'
              value={formData.date}
              onChange={handleInputChange}
              required
              className='bg-gray-500 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500'
            />
          </div>

          <div className='mb-4'>
            <label
              htmlFor='time'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Time
            </label>
            <input
              type='time'
              id='time'
              name='time'
              value={formData.time}
              onChange={handleInputChange}
              required
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500'
            />
          </div>

          <div className='mb-4'>
            <label
              htmlFor='patientName'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Patient Name
            </label>
            <input
              type='text'
              id='patientName'
              name='patientName'
              value={formData.patientName}
              onChange={handleInputChange}
              required
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500'
            />
          </div>

          <div className='mb-4'>
            <label
              htmlFor='patientContact'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Patient Contact
            </label>
            <input
              type='tel'
              id='patientContact'
              name='patientContact'
              value={formData.patientContact}
              onChange={handleInputChange}
              required
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500'
            />
          </div>

          <div className='mb-6'>
            <label
              htmlFor='notes'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Notes
            </label>
            <textarea
              id='notes'
              name='notes'
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500'
            ></textarea>
          </div>

          <button
            type='submit'
            disabled={isLoading}
            className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50'
          >
            {isLoading ? 'Creating...' : 'Create Appointment'}
          </button>
        </form>
      )}
    </div>
  );
}
