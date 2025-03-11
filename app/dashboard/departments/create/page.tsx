'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import { db, auth } from '@/lib/firebase-client';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import type { Company, Employee } from '@/app/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CreateDepartmentPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadataFields, setMetadataFields] = useState<
    { key: string; value: string }[]
  >([{ key: '', value: '' }]);
  // Add activeTab state
  const [activeTab, setActiveTab] = useState('basic');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    companyId: '',
    managerId: '',
    location: '',
    budget: '',
    status: 'Active',
  });

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

  useEffect(() => {
    // Fetch employees when a company is selected
    async function fetchEmployees() {
      if (!formData.companyId) {
        setEmployees([]);
        setFilteredEmployees([]);
        return;
      }

      try {
        const user = auth.currentUser;
        if (!user) return;

        const employeesQuery = query(
          collection(db, 'employees'),
          where('userId', '==', user.uid),
          where('companyId', '==', formData.companyId)
        );
        const employeesSnapshot = await getDocs(employeesQuery);
        const employeesData = employeesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Employee[];

        setEmployees(employeesData);
        setFilteredEmployees(employeesData);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    }

    fetchEmployees();
  }, [formData.companyId]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMetadataChange = (
    index: number,
    field: 'key' | 'value',
    value: string
  ) => {
    const updatedFields = [...metadataFields];
    updatedFields[index][field] = value;
    setMetadataFields(updatedFields);
  };

  const addMetadataField = () => {
    setMetadataFields([...metadataFields, { key: '', value: '' }]);
  };

  const removeMetadataField = (index: number) => {
    const updatedFields = metadataFields.filter((_, i) => i !== index);
    setMetadataFields(updatedFields);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to create a department');
      }

      if (!formData.companyId) {
        throw new Error('Please select a company for this department');
      }

      // Get company name for the selected company
      const selectedCompany = companies.find(
        (company) => company.id === formData.companyId
      );
      if (!selectedCompany) {
        throw new Error('Selected company not found');
      }

      // Get manager name if a manager is selected
      let managerName = '';
      if (formData.managerId) {
        const selectedManager = employees.find(
          (employee) => employee.id === formData.managerId
        );
        if (selectedManager) {
          managerName = `${selectedManager.firstName} ${selectedManager.lastName}`;
        }
      }

      // Process metadata
      const metadata: Record<string, string> = {};
      metadataFields.forEach((field) => {
        if (field.key.trim() && field.value.trim()) {
          metadata[field.key.trim()] = field.value.trim();
        }
      });

      // Create department in Firestore
      const departmentData = {
        ...formData,
        companyName: selectedCompany.name,
        managerName,
        budget: formData.budget ? Number.parseFloat(formData.budget) : null,
        employeeCount: 0,
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, 'departments'), departmentData);

      // Redirect to departments page
      router.push('/dashboard/departments');
    } catch (error) {
      console.error('Error creating department:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex items-center mb-6'>
        <Button variant='ghost' size='sm' asChild className='mr-4'>
          <Link href='/dashboard/departments'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back
          </Link>
        </Button>
        <div>
          <h1 className='text-3xl font-bold'>Add New Department</h1>
          <p className='text-gray-600'>Create a new company department</p>
        </div>
      </div>

      {error && (
        <div className='mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded'>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Replace the Tabs component with controlled version */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='basic'>Basic Information</TabsTrigger>
            <TabsTrigger value='metadata'>Metadata</TabsTrigger>
          </TabsList>

          <TabsContent value='basic'>
            <Card>
              <CardHeader>
                <CardTitle>Department Information</CardTitle>
                <CardDescription>
                  Enter the details for the new department
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='companyId'>Company</Label>
                  <Select
                    value={formData.companyId}
                    onValueChange={(value) =>
                      handleSelectChange('companyId', value)
                    }
                    required
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
                  <Label htmlFor='name'>Department Name</Label>
                  <Input
                    id='name'
                    name='name'
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='description'>Description</Label>
                  <Textarea
                    id='description'
                    name='description'
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='status'>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleSelectChange('status', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Active'>Active</SelectItem>
                      <SelectItem value='Inactive'>Inactive</SelectItem>
                      <SelectItem value='Restructuring'>
                        Restructuring
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='location'>Location</Label>
                  <Input
                    id='location'
                    name='location'
                    value={formData.location}
                    onChange={handleInputChange}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='budget'>Budget</Label>
                  <Input
                    id='budget'
                    name='budget'
                    type='number'
                    value={formData.budget}
                    onChange={handleInputChange}
                    placeholder='0.00'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='managerId'>Department Manager</Label>
                  <Select
                    value={formData.managerId}
                    onValueChange={(value) =>
                      handleSelectChange('managerId', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select a manager' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='no-manager'>No Manager</SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName} -{' '}
                          {employee.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className='flex justify-between'>
                <Button
                  variant='outline'
                  type='button'
                  onClick={() => router.push('/dashboard/departments')}
                >
                  Cancel
                </Button>
                {/* Replace the Next button onClick handler */}
                <Button type='button' onClick={() => setActiveTab('metadata')}>
                  Next
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value='metadata'>
            <Card>
              <CardHeader>
                <CardTitle>Department Metadata</CardTitle>
                <CardDescription>
                  Add custom fields and metadata for this department
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-4'>
                  {metadataFields.map((field, index) => (
                    <div key={index} className='flex items-center gap-2'>
                      <div className='flex-1'>
                        <Label
                          htmlFor={`metadata-key-${index}`}
                          className='sr-only'
                        >
                          Key
                        </Label>
                        <Input
                          id={`metadata-key-${index}`}
                          placeholder='Key'
                          value={field.key}
                          onChange={(e) =>
                            handleMetadataChange(index, 'key', e.target.value)
                          }
                        />
                      </div>
                      <div className='flex-1'>
                        <Label
                          htmlFor={`metadata-value-${index}`}
                          className='sr-only'
                        >
                          Value
                        </Label>
                        <Input
                          id={`metadata-value-${index}`}
                          placeholder='Value'
                          value={field.value}
                          onChange={(e) =>
                            handleMetadataChange(index, 'value', e.target.value)
                          }
                        />
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={() => removeMetadataField(index)}
                        disabled={metadataFields.length === 1}
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={addMetadataField}
                    className='mt-2'
                  >
                    <Plus className='h-4 w-4 mr-2' />
                    Add Field
                  </Button>
                </div>
              </CardContent>
              <CardFooter className='flex justify-between'>
                {/* Replace the Previous button onClick handler */}
                <Button
                  variant='outline'
                  type='button'
                  onClick={() => setActiveTab('basic')}
                >
                  Previous
                </Button>
                <Button type='submit' disabled={isLoading}>
                  <Save className='mr-2 h-4 w-4' />
                  {isLoading ? 'Creating...' : 'Create Department'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}
