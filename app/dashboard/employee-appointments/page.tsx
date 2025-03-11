'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PlusCircle,
  FileEdit,
  Eye,
  Calendar,
  Building,
  User,
} from 'lucide-react';
import { db, auth } from '@/lib/firebase-client';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import type { Employee } from '@/app/types';

// Define the EmployeeAppointment type
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

export default function EmployeeAppointmentsPage() {
  const router = useRouter();
  const [employeeAppointments, setEmployeeAppointments] = useState<
    EmployeeAppointment[]
  >([]);
  const [employees, setEmployees] = useState<Record<string, Employee>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEmployeeAppointments() {
      try {
        setIsLoading(true);
        const user = auth.currentUser;
        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch all employee appointments for this user
        const appointmentsQuery = query(
          collection(db, 'employeeAppointments'),
          where('userId', '==', user.uid)
        );
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        const appointmentsData = appointmentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as EmployeeAppointment[];

        // Get unique employee IDs to fetch employee details
        const employeeIds = [
          ...new Set(appointmentsData.map((app) => app.employeeId)),
        ];

        // Fetch employee details
        const employeesData: Record<string, Employee> = {};
        for (const empId of employeeIds) {
          const empDoc = await getDoc(doc(db, 'employees', empId));
          if (empDoc.exists()) {
            employeesData[empId] = {
              id: empDoc.id,
              ...empDoc.data(),
            } as Employee;
          }
        }

        setEmployeeAppointments(appointmentsData);
        setEmployees(employeesData);
        setError(null);
      } catch (error) {
        console.error('Error fetching employee appointments:', error);
        setError('Failed to load employee appointments');
      } finally {
        setIsLoading(false);
      }
    }

    fetchEmployeeAppointments();
  }, [router]);

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

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-3xl font-bold'>Employee Appointments</h1>
          <p className='text-gray-500'>Individual appointments for employees</p>
        </div>
        <Button asChild>
          <Link href='/dashboard/appointments/create'>
            <PlusCircle className='mr-2 h-4 w-4' />
            Create Appointment
          </Link>
        </Button>
      </div>

      {error && (
        <div className='mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Employee Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex justify-center items-center h-64'>
              Loading...
            </div>
          ) : employeeAppointments.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              <p className='mb-4'>No employee appointments found.</p>
              <Button asChild>
                <Link href='/dashboard/appointments/create'>
                  Create an appointment
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Clinic</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className='font-medium'>
                      <div className='flex items-center'>
                        <User className='mr-2 h-4 w-4 text-gray-400' />
                        {appointment.employeeName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center'>
                        <Building className='mr-2 h-4 w-4 text-gray-400' />
                        {appointment.companyName}
                      </div>
                    </TableCell>
                    <TableCell>{appointment.clinicName}</TableCell>
                    <TableCell>
                      <div className='flex items-center'>
                        <Calendar className='mr-2 h-4 w-4 text-gray-400' />
                        {formatDate(appointment.date)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                    <TableCell className='text-right'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='sm'>
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/appointments/${appointment.parentAppointmentId}`}
                            >
                              <Eye className='mr-2 h-4 w-4' />
                              View Company Appointment
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/employee-appointments/${appointment.id}`}
                            >
                              <Eye className='mr-2 h-4 w-4' />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/employee-appointments/${appointment.id}/edit`}
                            >
                              <FileEdit className='mr-2 h-4 w-4' />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
