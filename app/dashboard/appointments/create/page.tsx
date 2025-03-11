'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, writeBatch } from '@/lib/firebase-client';
import {
  collection,
  doc,
  serverTimestamp,
  getDocs,
  getDoc,
  query,
  where,
} from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { generatePurchaseOrderNumber } from '@/lib/utils';
import type { Department, Site } from '@/app/types';

interface Company {
  id: string;
  name: string;
}

interface Clinic {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position?: string;
  departmentId?: string;
  siteId?: string;
}

const CreateAppointmentPage = () => {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [billingCompanies, setBillingCompanies] = useState<Company[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clinicCapacity, setClinicCapacity] = useState<number | null>(null);
  const [bookedCount, setBookedCount] = useState<number>(0);
  const [formData, setFormData] = useState({
    companyId: '',
    billingCompanyId: '',
    clinicId: '',
    date: new Date(),
    status: 'scheduled',
    notes: '',
    purchaseOrderNumber: generatePurchaseOrderNumber(),
  });
  const [date, setDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const fetchCompanies = async () => {
      const querySnapshot = await getDocs(collection(db, 'companies'));
      const companiesData: Company[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setCompanies(companiesData);
      setBillingCompanies(companiesData);
    };

    const fetchClinics = async () => {
      const querySnapshot = await getDocs(collection(db, 'clinics'));
      const clinicsData: Clinic[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setClinics(clinicsData);
    };

    const fetchEmployees = async () => {
      const querySnapshot = await getDocs(collection(db, 'employees'));
      const employeesData: Employee[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        firstName: doc.data().firstName,
        lastName: doc.data().lastName,
        ...doc.data(),
      }));
      setEmployees(employeesData);
    };

    fetchCompanies();
    fetchClinics();
    fetchEmployees();
  }, []);

  useEffect(() => {
    async function fetchCompanyData() {
      if (!formData.companyId) {
        setEmployees([]);
        setDepartments([]);
        setSites([]);
        return;
      }

      try {
        const user = auth.currentUser;
        if (!user) return;

        // Fetch employees for the selected company
        const employeesQuery = query(
          collection(db, 'employees'),
          where('companyId', '==', formData.companyId),
          where('userId', '==', user.uid)
        );
        const employeesSnapshot = await getDocs(employeesQuery);
        const employeesData = employeesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Employee[];
        setEmployees(employeesData);

        // Fetch departments for the selected company
        const departmentsQuery = query(
          collection(db, 'departments'),
          where('companyId', '==', formData.companyId),
          where('userId', '==', user.uid)
        );
        const departmentsSnapshot = await getDocs(departmentsQuery);
        const departmentsData = departmentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Department[];
        setDepartments(departmentsData);

        // Fetch sites for the selected company
        const sitesQuery = query(
          collection(db, 'sites'),
          where('companyId', '==', formData.companyId),
          where('userId', '==', user.uid)
        );
        const sitesSnapshot = await getDocs(sitesQuery);
        const sitesData = sitesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Site[];
        setSites(sitesData);
      } catch (error) {
        console.error('Error fetching company data:', error);
      }
    }

    fetchCompanyData();
  }, [formData.companyId]);

  useEffect(() => {
    async function checkClinicCapacity() {
      if (!formData.clinicId || !formData.date) return;

      try {
        // Get clinic capacity
        const clinicDoc = await getDoc(doc(db, 'clinics', formData.clinicId));
        if (clinicDoc.exists()) {
          const clinicData = clinicDoc.data() as Clinic;
          setClinicCapacity(clinicData.maxDailyAppointments);
        }

        // Count booked appointments for this date and clinic
        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('clinicId', '==', formData.clinicId),
          where('date', '==', formData.date)
        );
        const appointmentsSnapshot = await getDocs(appointmentsQuery);

        let totalBookedEmployees = 0;
        appointmentsSnapshot.docs.forEach((doc) => {
          const appointmentData = doc.data();
          totalBookedEmployees += appointmentData.employeeCount || 0;
        });

        setBookedCount(totalBookedEmployees);
      } catch (error) {
        console.error('Error checking clinic capacity:', error);
      }
    }

    checkClinicCapacity();
  }, [formData.clinicId, formData.date]);

  const handleInputChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleGeneratePO = () => {
    setFormData((prev) => ({
      ...prev,
      purchaseOrderNumber: generatePurchaseOrderNumber(),
    }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setDate(date);
    setFormData({
      ...formData,
      date: date || new Date(),
    });
  };

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployees((prevSelected) => {
      if (prevSelected.includes(employeeId)) {
        return prevSelected.filter((id) => id !== employeeId);
      } else {
        return [...prevSelected, employeeId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to create an appointment');
      }

      // Start a new batch
      const batch = writeBatch(db);

      // Get company and clinic names for display purposes
      const companyDoc = await getDoc(doc(db, 'companies', formData.companyId));
      const companyName = companyDoc.exists()
        ? companyDoc.data().name
        : 'Unknown Company';

      const billingCompanyDoc = await getDoc(
        doc(db, 'companies', formData.billingCompanyId)
      );
      const billingCompanyName = billingCompanyDoc.exists()
        ? billingCompanyDoc.data().name
        : 'Unknown Company';

      const clinicDoc = await getDoc(doc(db, 'clinics', formData.clinicId));
      const clinicName = clinicDoc.exists()
        ? clinicDoc.data().name
        : 'Unknown Clinic';

      // Create main appointment document
      const appointmentRef = doc(collection(db, 'appointments'));
      batch.set(appointmentRef, {
        ...formData,
        companyName,
        billingCompanyName,
        clinicName,
        employeeCount: selectedEmployees.length,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create individual employee appointments
      for (const employeeId of selectedEmployees) {
        const employee = employees.find((e) => e.id === employeeId);
        if (employee) {
          const employeeAppointmentRef = doc(
            collection(db, 'employeeAppointments')
          );
          batch.set(employeeAppointmentRef, {
            parentAppointmentId: appointmentRef.id,
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            companyId: formData.companyId,
            companyName,
            clinicId: formData.clinicId,
            clinicName,
            date: formData.date,
            status: formData.status,
            notes: formData.notes,
            userId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          // Also add to appointmentEmployees collection
          const appointmentEmployeeRef = doc(
            collection(db, 'appointmentEmployees')
          );
          batch.set(appointmentEmployeeRef, {
            appointmentId: appointmentRef.id,
            employeeId: employee.id,
            userId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }

      // Commit the batch
      await batch.commit();

      // Redirect to appointments page
      router.push('/dashboard/appointments');
    } catch (error) {
      console.error('Error creating appointment:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleDepartmentSelection = async (departmentId: string) => {
    try {
      // Get all employees in this department
      const departmentEmployeesQuery = query(
        collection(db, 'departmentEmployees'),
        where('departmentId', '==', departmentId)
      );
      const snapshot = await getDocs(departmentEmployeesQuery);

      const employeeIds = snapshot.docs.map((doc) => doc.data().employeeId);

      // Add these employees to the selected list (avoiding duplicates)
      setSelectedEmployees((prev) => {
        const newSelection = [...prev];
        employeeIds.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    } catch (error) {
      console.error('Error selecting department employees:', error);
    }
  };

  const handleSiteSelection = async (siteId: string) => {
    try {
      // Get all employees at this site
      const siteEmployeesQuery = query(
        collection(db, 'siteEmployees'),
        where('siteId', '==', siteId)
      );
      const snapshot = await getDocs(siteEmployeesQuery);

      const employeeIds = snapshot.docs.map((doc) => doc.data().employeeId);

      // Add these employees to the selected list (avoiding duplicates)
      setSelectedEmployees((prev) => {
        const newSelection = [...prev];
        employeeIds.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    } catch (error) {
      console.error('Error selecting site employees:', error);
    }
  };

  const handleSelectAll = (type: 'employees' | 'departments' | 'sites') => {
    switch (type) {
      case 'employees':
        setSelectedEmployees(employees.map((e) => e.id));
        break;
      case 'departments':
        departments.forEach((dept) => handleDepartmentSelection(dept.id));
        break;
      case 'sites':
        sites.forEach((site) => handleSiteSelection(site.id));
        break;
    }
  };

  const remainingCapacity =
    clinicCapacity !== null ? clinicCapacity - bookedCount : null;

  return (
    <div className='container py-8'>
      <h1 className='text-3xl font-bold mb-6'>Create Appointment</h1>
      {error && <div className='text-red-500 mb-4'>{error}</div>}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
            <CardDescription>
              Fill in the details for the new appointment
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='purchaseOrderNumber'>Purchase Order Number</Label>
              <div className='flex space-x-2'>
                <input
                  id='purchaseOrderNumber'
                  value={formData.purchaseOrderNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      purchaseOrderNumber: e.target.value,
                    })
                  }
                  className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                />
                <Button type='button' onClick={handleGeneratePO}>
                  Generate
                </Button>
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='companyId'>Company</Label>
              <Select
                value={formData.companyId}
                onValueChange={(value) => handleInputChange('companyId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select a company' />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='billingCompanyId'>Billing Company</Label>
              <Select
                value={formData.billingCompanyId}
                onValueChange={(value) =>
                  handleInputChange('billingCompanyId', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select a billing company' />
                </SelectTrigger>
                <SelectContent>
                  {billingCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='clinicId'>Clinic</Label>
              <Select
                value={formData.clinicId}
                onValueChange={(value) => handleInputChange('clinicId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select a clinic' />
                </SelectTrigger>
                <SelectContent>
                  {clinics.map((clinic) => (
                    <SelectItem key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={date}
                    onSelect={handleDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='status'>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='scheduled'>Scheduled</SelectItem>
                  <SelectItem value='confirmed'>Confirmed</SelectItem>
                  <SelectItem value='cancelled'>Cancelled</SelectItem>
                  <SelectItem value='completed'>Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='notes'>Notes</Label>
              <Textarea
                id='notes'
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Selection</CardTitle>
          </CardHeader>
          <CardContent>
            {!formData.companyId ? (
              <p className='text-center py-4 text-gray-500'>
                Please select a company first to view employees
              </p>
            ) : (
              <>
                <p className='mb-4'>
                  Selected employees: {selectedEmployees.length}
                  {remainingCapacity !== null &&
                    selectedEmployees.length > remainingCapacity && (
                      <span className='text-red-500 ml-2'>
                        (Exceeds clinic capacity by{' '}
                        {selectedEmployees.length - remainingCapacity})
                      </span>
                    )}
                </p>

                <Tabs defaultValue='individual'>
                  <TabsList className='mb-4'>
                    <TabsTrigger value='individual'>
                      Individual Selection
                    </TabsTrigger>
                    <TabsTrigger value='department'>By Department</TabsTrigger>
                    <TabsTrigger value='site'>By Site</TabsTrigger>
                  </TabsList>

                  <TabsContent value='individual' className='space-y-4'>
                    {employees.length === 0 ? (
                      <p className='text-center py-4 text-gray-500'>
                        No employees found for this company
                      </p>
                    ) : (
                      <>
                        <div className='flex justify-between items-center mb-4'>
                          <h3 className='text-lg font-semibold'>Employees</h3>
                          <Button onClick={() => handleSelectAll('employees')}>
                            Select All
                          </Button>
                        </div>
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                          {employees.map((employee) => (
                            <div
                              key={employee.id}
                              className='flex items-center space-x-2'
                            >
                              <Checkbox
                                id={`employee-${employee.id}`}
                                checked={selectedEmployees.includes(
                                  employee.id
                                )}
                                onCheckedChange={() =>
                                  handleEmployeeSelection(employee.id)
                                }
                              />
                              <label
                                htmlFor={`employee-${employee.id}`}
                                className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                              >
                                {employee.firstName} {employee.lastName} -{' '}
                                {employee.position}
                              </label>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value='department' className='space-y-4'>
                    {departments.length === 0 ? (
                      <p className='text-center py-4 text-gray-500'>
                        No departments found for this company
                      </p>
                    ) : (
                      <>
                        <div className='flex justify-between items-center mb-4'>
                          <h3 className='text-lg font-semibold'>Departments</h3>
                          <Button
                            onClick={() => handleSelectAll('departments')}
                          >
                            Select All
                          </Button>
                        </div>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          {departments.map((department) => (
                            <div
                              key={department.id}
                              className='flex items-center space-x-2'
                            >
                              <Checkbox
                                id={`department-${department.id}`}
                                checked={selectedEmployees.some(
                                  (id) =>
                                    employees.find((e) => e.id === id)
                                      ?.departmentId === department.id
                                )}
                                onCheckedChange={() =>
                                  handleDepartmentSelection(department.id)
                                }
                              />
                              <label
                                htmlFor={`department-${department.id}`}
                                className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                              >
                                {department.name} ({department.employeeCount}{' '}
                                employees)
                              </label>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value='site' className='space-y-4'>
                    {sites.length === 0 ? (
                      <p className='text-center py-4 text-gray-500'>
                        No sites found for this company
                      </p>
                    ) : (
                      <>
                        <div className='flex justify-between items-center mb-4'>
                          <h3 className='text-lg font-semibold'>Sites</h3>
                          <Button onClick={() => handleSelectAll('sites')}>
                            Select All
                          </Button>
                        </div>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          {sites.map((site) => (
                            <div
                              key={site.id}
                              className='flex items-center space-x-2'
                            >
                              <Checkbox
                                id={`site-${site.id}`}
                                checked={selectedEmployees.some(
                                  (id) =>
                                    employees.find((e) => e.id === id)
                                      ?.siteId === site.id
                                )}
                                onCheckedChange={() =>
                                  handleSiteSelection(site.id)
                                }
                              />
                              <label
                                htmlFor={`site-${site.id}`}
                                className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                              >
                                {site.name} ({site.employeeCount} employees)
                              </label>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </CardContent>
        </Card>

        <CardFooter className='mt-6'>
          <Button type='submit' disabled={isLoading} className='w-full'>
            {isLoading ? 'Creating...' : 'Create Appointment'}
          </Button>
        </CardFooter>
      </form>
    </div>
  );
};

export default CreateAppointmentPage;
