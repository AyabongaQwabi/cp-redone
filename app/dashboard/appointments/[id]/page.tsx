'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase-client';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Building,
  FileText,
  Clock,
  User,
  Users,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock3,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Appointment, Employee, AppointmentEmployee } from '@/app/types';

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

interface AppointmentDetailsPageProps {
  params: {
    id: string;
  };
}

export default function AppointmentDetailsPage({
  params,
}: AppointmentDetailsPageProps) {
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeAppointments, setEmployeeAppointments] = useState<
    EmployeeAppointment[]
  >([]);
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

        // Fetch appointment details
        const appointmentDoc = await getDoc(doc(db, 'appointments', params.id));
        if (!appointmentDoc.exists()) {
          setError('Appointment not found');
          return;
        }

        const appointmentData = {
          id: appointmentDoc.id,
          ...appointmentDoc.data(),
        } as Appointment;

        // Verify this appointment belongs to the current user
        if (appointmentData.userId !== user.uid) {
          setError("You don't have permission to view this appointment");
          return;
        }

        setAppointment(appointmentData);

        // Fetch employees assigned to this appointment
        const appointmentEmployeesQuery = query(
          collection(db, 'appointmentEmployees'),
          where('appointmentId', '==', params.id)
        );
        const appointmentEmployeesSnapshot = await getDocs(
          appointmentEmployeesQuery
        );
        const appointmentEmployees = appointmentEmployeesSnapshot.docs.map(
          (doc) => doc.data() as AppointmentEmployee
        );

        // Get the full employee details for each assigned employee
        const employeePromises = appointmentEmployees.map(async (ae) => {
          const employeeDoc = await getDoc(doc(db, 'employees', ae.employeeId));
          if (employeeDoc.exists()) {
            return {
              id: employeeDoc.id,
              ...employeeDoc.data(),
            } as Employee;
          }
          return null;
        });

        const employeeResults = await Promise.all(employeePromises);
        const validEmployees = employeeResults.filter(
          (e): e is Employee => e !== null
        );
        setEmployees(validEmployees);

        // Fetch individual employee appointments
        const employeeAppointmentsQuery = query(
          collection(db, 'employeeAppointments'),
          where('parentAppointmentId', '==', params.id)
        );
        const employeeAppointmentsSnapshot = await getDocs(
          employeeAppointmentsQuery
        );
        const employeeAppointmentsData = employeeAppointmentsSnapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })
        ) as EmployeeAppointment[];

        setEmployeeAppointments(employeeAppointmentsData);
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
        return <Badge className='bg-green-500 text-white'>Approved</Badge>;
      case 'In Progress':
        return <Badge className='bg-blue-500 text-white'>In Progress</Badge>;
      case 'Complete':
        return <Badge className='bg-purple-500 text-white'>Complete</Badge>;
      case 'Declined':
        return <Badge className='bg-red-500 text-white'>Declined</Badge>;
      default:
        return <Badge className='bg-yellow-500 text-white'>Pending</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle2 className='h-5 w-5 text-green-500' />;
      case 'In Progress':
        return <Clock3 className='h-5 w-5 text-blue-500' />;
      case 'Complete':
        return <CheckCircle2 className='h-5 w-5 text-purple-500' />;
      case 'Declined':
        return <AlertCircle className='h-5 w-5 text-red-500' />;
      default:
        return <Clock className='h-5 w-5 text-yellow-500' />;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
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
          <Link href='/dashboard/appointments'>Back to Appointments</Link>
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
          <Link href='/dashboard/appointments'>Back to Appointments</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6'>
        <div>
          <h1 className='text-3xl font-bold'>Appointment Details</h1>
          <p className='text-muted-foreground'>
            View and manage appointment information
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button asChild variant='outline'>
            <Link href={`/dashboard/appointments/${params.id}/edit`}>
              Edit Appointment
            </Link>
          </Button>
          <Button asChild>
            <Link href='/dashboard/appointments'>Back to Appointments</Link>
          </Button>
        </div>
      </div>

      <div className='grid gap-6 mb-6'>
        <Card className='overflow-hidden border-none shadow-md'>
          <div className='bg-primary/10 p-6'>
            <div className='flex flex-col md:flex-row justify-between gap-4'>
              <div className='flex items-center gap-3'>
                <Building className='h-8 w-8 text-primary' />
                <div>
                  <h2 className='text-2xl font-bold'>
                    {appointment.companyName}
                  </h2>
                  <p className='text-muted-foreground'>Company Appointment</p>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                {getStatusIcon(appointment.status)}
                <span className='font-medium'>{appointment.status}</span>
              </div>
            </div>
          </div>

          <CardContent className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='flex flex-col gap-1'>
                <span className='text-sm text-muted-foreground flex items-center gap-2'>
                  <FileText className='h-4 w-4' /> Purchase Order
                </span>
                <span className='text-lg font-medium'>
                  {appointment.purchaseOrderNumber}
                </span>
              </div>

              <div className='flex flex-col gap-1'>
                <span className='text-sm text-muted-foreground flex items-center gap-2'>
                  <Calendar className='h-4 w-4' /> Appointment Date
                </span>
                <span className='text-lg font-medium'>
                  {formatDate(appointment.date)}
                </span>
              </div>

              <div className='flex flex-col gap-1'>
                <span className='text-sm text-muted-foreground flex items-center gap-2'>
                  <Building className='h-4 w-4' /> Clinic
                </span>
                <span className='text-lg font-medium'>
                  {appointment.clinicName}
                </span>
              </div>
            </div>

            {appointment.notes && (
              <div className='mt-6'>
                <h3 className='text-sm font-medium text-muted-foreground mb-2'>
                  Notes
                </h3>
                <p className='p-3 bg-muted rounded-md'>{appointment.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='flex items-center gap-2'>
                  <Users className='h-5 w-5' />
                  Employee Appointments ({employees.length})
                </CardTitle>
                <CardDescription>
                  Individual appointments for each employee
                </CardDescription>
              </div>
              <Badge variant='outline' className='flex items-center gap-1'>
                <User className='h-3 w-3' /> {employees.length} Employees
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue='grid' className='w-full'>
              <TabsList className='mb-4'>
                <TabsTrigger value='grid'>Grid View</TabsTrigger>
                <TabsTrigger value='list'>List View</TabsTrigger>
              </TabsList>

              <TabsContent value='grid'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {employees.map((employee) => {
                    const employeeAppointment = employeeAppointments.find(
                      (ea) => ea.employeeId === employee.id
                    );

                    return (
                      <Card
                        key={employee.id}
                        className='overflow-hidden hover:shadow-md transition-shadow'
                      >
                        <CardHeader className='pb-2'>
                          <div className='flex items-center gap-3'>
                            <Avatar>
                              <AvatarFallback>
                                {getInitials(
                                  `${employee.firstName} ${employee.lastName}`
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className='font-semibold'>
                                {employee.firstName} {employee.lastName}
                              </h3>
                              <p className='text-sm text-muted-foreground'>
                                {employee.position}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className='pb-3'>
                          <div className='grid grid-cols-2 gap-2 text-sm mb-3'>
                            <div>
                              <p className='text-muted-foreground'>Email</p>
                              <p className='truncate'>{employee.email}</p>
                            </div>
                            <div>
                              <p className='text-muted-foreground'>Phone</p>
                              <p>
                                {employee.cellPhone || employee.phone || 'N/A'}
                              </p>
                            </div>
                          </div>

                          {employeeAppointment ? (
                            <div className='mt-2 p-3 bg-muted rounded-md'>
                              <div className='flex justify-between items-center mb-2'>
                                <span className='text-sm font-medium'>
                                  Appointment Status
                                </span>
                                {getStatusBadge(employeeAppointment.status)}
                              </div>
                              <Separator className='my-2' />
                              <div className='flex justify-end mt-2'>
                                <Button
                                  asChild
                                  variant='ghost'
                                  size='sm'
                                  className='text-primary'
                                >
                                  <Link
                                    href={`/dashboard/employee-appointments/${employeeAppointment.id}`}
                                  >
                                    View Details{' '}
                                    <ArrowRight className='ml-1 h-3 w-3' />
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className='mt-2 p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm'>
                              No individual appointment found
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value='list'>
                <div className='border rounded-md divide-y'>
                  {employees.map((employee) => {
                    const employeeAppointment = employeeAppointments.find(
                      (ea) => ea.employeeId === employee.id
                    );

                    return (
                      <div key={employee.id} className='p-4 hover:bg-muted/50'>
                        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                          <div className='flex items-center gap-3'>
                            <Avatar className='h-10 w-10'>
                              <AvatarFallback>
                                {getInitials(
                                  `${employee.firstName} ${employee.lastName}`
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className='font-semibold'>
                                {employee.firstName} {employee.lastName}
                              </h3>
                              <p className='text-sm text-muted-foreground'>
                                {employee.position}
                              </p>
                            </div>
                          </div>

                          <div className='flex items-center gap-4'>
                            {employeeAppointment ? (
                              <>
                                {getStatusBadge(employeeAppointment.status)}
                                <Button asChild variant='ghost' size='sm'>
                                  <Link
                                    href={`/dashboard/employee-appointments/${employeeAppointment.id}`}
                                  >
                                    View Details{' '}
                                    <ArrowRight className='ml-1 h-3 w-3' />
                                  </Link>
                                </Button>
                              </>
                            ) : (
                              <Badge
                                variant='outline'
                                className='text-yellow-600 bg-yellow-50'
                              >
                                No appointment
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className='bg-muted/50 border-t'>
            <div className='w-full flex justify-between items-center'>
              <p className='text-sm text-muted-foreground'>
                Showing {employees.length} employees for this appointment
              </p>
              <Button asChild variant='outline' size='sm'>
                <Link href='/dashboard/employee-appointments'>
                  View All Employee Appointments
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
