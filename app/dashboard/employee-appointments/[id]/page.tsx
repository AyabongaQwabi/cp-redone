'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase-client';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

interface EmployeeAppointment {
  id: string;
  parentAppointmentId: string;
  employeeId: string;
  employeeName: string;
  companyId: string;
  companyName: string;
  clinicId: string;
  clinicName: string;
  date: string;
  status: string;
  notes?: string;
  userId: string;
  createdAt: any;
  updatedAt: any;
}

export default function EmployeeAppointmentDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [appointment, setAppointment] = useState<EmployeeAppointment | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAppointmentData() {
      try {
        setIsLoading(true);
        const user = auth.currentUser;
        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch employee appointment details
        const appointmentDoc = await getDoc(
          doc(db, 'employeeAppointments', params.id)
        );
        if (!appointmentDoc.exists()) {
          setError('Appointment not found');
          return;
        }

        const appointmentData = {
          id: appointmentDoc.id,
          ...appointmentDoc.data(),
        } as EmployeeAppointment;

        // Verify this appointment belongs to the current user
        if (appointmentData.userId !== user.uid) {
          setError("You don't have permission to view this appointment");
          return;
        }

        setAppointment(appointmentData);
        setError(null);
      } catch (error) {
        console.error('Error fetching appointment data:', error);
        setError('Failed to load appointment details');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAppointmentData();
  }, [params.id, router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <Badge className='bg-green-500'>Approved</Badge>;
      case 'In Progress':
        return <Badge className='bg-blue-500'>In Progress</Badge>;
      case 'Complete':
        return <Badge className='bg-purple-500'>Complete</Badge>;
      case 'Declined':
        return <Badge className='bg-red-500'>Declined</Badge>;
      default:
        return <Badge className='bg-yellow-500'>Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-64'>Loading...</div>
    );
  }

  if (error) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
          {error}
        </div>
        <Button asChild className='mt-4'>
          <Link href='/dashboard/employee-appointments'>
            Back to Employee Appointments
          </Link>
        </Button>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded'>
          Appointment not found
        </div>
        <Button asChild className='mt-4'>
          <Link href='/dashboard/employee-appointments'>
            Back to Employee Appointments
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold'>Employee Appointment Details</h1>
        <div className='flex space-x-2'>
          <Button asChild variant='outline'>
            <Link href={`/dashboard/employee-appointments/${params.id}/edit`}>
              Edit
            </Link>
          </Button>
          <Button asChild>
            <Link href='/dashboard/employee-appointments'>
              Back to Employee Appointments
            </Link>
          </Button>
        </div>
      </div>

      <div className='grid gap-6 mb-6'>
        <Card>
          <CardHeader>
            <CardTitle>Appointment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <dt className='text-sm font-medium text-gray-500'>Employee</dt>
                <dd className='mt-1 text-lg'>{appointment.employeeName}</dd>
              </div>
              <div>
                <dt className='text-sm font-medium text-gray-500'>Status</dt>
                <dd className='mt-1'>{getStatusBadge(appointment.status)}</dd>
              </div>
              <div>
                <dt className='text-sm font-medium text-gray-500'>Company</dt>
                <dd className='mt-1 text-lg'>{appointment.companyName}</dd>
              </div>
              <div>
                <dt className='text-sm font-medium text-gray-500'>Clinic</dt>
                <dd className='mt-1 text-lg'>{appointment.clinicName}</dd>
              </div>
              <div>
                <dt className='text-sm font-medium text-gray-500'>Date</dt>
                <dd className='mt-1 text-lg'>{formatDate(appointment.date)}</dd>
              </div>
              <div>
                <dt className='text-sm font-medium text-gray-500'>
                  Parent Appointment
                </dt>
                <dd className='mt-1'>
                  <Link
                    href={`/dashboard/appointments/${appointment.parentAppointmentId}`}
                    className='text-primary hover:underline'
                  >
                    View Company Appointment
                  </Link>
                </dd>
              </div>
              <div className='md:col-span-2'>
                <dt className='text-sm font-medium text-gray-500'>Notes</dt>
                <dd className='mt-1'>
                  {appointment.notes ? appointment.notes : 'No notes provided'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
