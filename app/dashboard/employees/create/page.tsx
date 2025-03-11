'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, storage } from '@/lib/firebase-client';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Company, Site, Department, EmployeeDocument } from '@/app/types';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export enum EmployeeDocumentType {
  MEDICAL_CERTIFICATE = 'Annexure 3 - Medical Certificate of Fitness.pdf',
  JOB_SPECIFICATION = 'Man Job Spec',
  HEIGHTS_SPECIFICATION = 'Man Job Spec for Working at Heights and Confined Spaces',
  NDA = 'Non-disclosure agreement 2023',
  HAZARDOUS_WORK_RECORD = 'Record of Hazardous Work DMR',
}

interface EmployeeDocumentTypeInterface {
  [key: string]: string;
}

export default function CreateEmployeePage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    employeeNumber: '',
    companyId: '',
    siteId: '',
    departmentId: '',
    startDate: '',
    status: 'Active',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
    },
    medicalInfo: {
      bloodType: '',
      allergies: '',
      medicalConditions: '',
      medications: '',
    },
    notes: '',
    documents: [] as EmployeeDocument[],
  });

  useEffect(() => {
    async function fetchData() {
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

        const sitesQuery = query(
          collection(db, 'sites'),
          where('userId', '==', user.uid)
        );
        const sitesSnapshot = await getDocs(sitesQuery);
        const sitesData = sitesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Site[];

        const departmentsQuery = query(
          collection(db, 'departments'),
          where('userId', '==', user.uid)
        );
        const departmentsSnapshot = await getDocs(departmentsQuery);
        const departmentsData = departmentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Department[];

        setCompanies(companiesData);
        setSites(sitesData);
        setDepartments(departmentsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      }
    }

    fetchData();
  }, [router]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Handle nested objects
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (
    file: File,
    documentType: EmployeeDocumentType
  ) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(
        storage,
        `employee_documents/${user.uid}/${fileName}`
      );
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const newDocument: EmployeeDocument = {
        id: Date.now().toString(), // temporary id
        employeeId: '', // will be set after employee is created
        name: documentType,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        url: downloadURL,
        documentType: documentType,
        status: 'Pending',
        uploadDate: new Date(),
        userId: user.uid,
      };

      setFormData((prev) => ({
        ...prev,
        documents: [...prev.documents, newDocument],
      }));
    } catch (error) {
      console.error('Error uploading file:', error);
      // Handle error (e.g., show error message to user)
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to create an employee');
      }

      // Process allergies, medical conditions, and medications as arrays
      const processedMedicalInfo = {
        bloodType: formData.medicalInfo.bloodType,
        allergies: formData.medicalInfo.allergies
          ? formData.medicalInfo.allergies.split(',').map((item) => item.trim())
          : [],
        medicalConditions: formData.medicalInfo.medicalConditions
          ? formData.medicalInfo.medicalConditions
              .split(',')
              .map((item) => item.trim())
          : [],
        medications: formData.medicalInfo.medications
          ? formData.medicalInfo.medications
              .split(',')
              .map((item) => item.trim())
          : [],
      };

      // Create employee in Firestore
      const employeeData = {
        ...formData,
        medicalInfo: processedMedicalInfo,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const employeeRef = await addDoc(
        collection(db, 'employees'),
        employeeData
      );

      // Update documents with the new employee ID
      const updatedDocuments = formData.documents.map((doc) => ({
        ...doc,
        employeeId: employeeRef.id,
      }));

      // Update the employee document with the updated documents array
      await updateDoc(employeeRef, { documents: updatedDocuments });

      // If employee is assigned to a company, update the company's employee count
      if (formData.companyId) {
        const companyRef = doc(db, 'companies', formData.companyId);
        const companyDoc = await getDoc(companyRef);

        if (companyDoc.exists()) {
          const companyData = companyDoc.data();
          await updateDoc(companyRef, {
            employeeCount: (companyData.employeeCount || 0) + 1,
            updatedAt: new Date(),
          });
        }
      }

      // Redirect to employees page
      router.push('/dashboard/employees');
    } catch (error) {
      console.error('Error creating employee:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex items-center mb-6'>
        <Button variant='ghost' size='sm' asChild className='mr-4'>
          <Link href='/dashboard/employees'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back
          </Link>
        </Button>
        <div>
          <h1 className='text-3xl font-bold'>Add New Employee</h1>
          <p className='text-gray-600'>Create a new employee record</p>
        </div>
      </div>

      {error && (
        <div className='mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded'>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='basic'>Basic Information</TabsTrigger>
            <TabsTrigger value='employment'>Employment Details</TabsTrigger>
            <TabsTrigger value='additional'>Additional Information</TabsTrigger>
            <TabsTrigger value='documents'>Documents</TabsTrigger>
          </TabsList>

          <TabsContent value='basic'>
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the employee's personal details
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='firstName'>First Name</Label>
                    <Input
                      id='firstName'
                      name='firstName'
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='lastName'>Last Name</Label>
                    <Input
                      id='lastName'
                      name='lastName'
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='email'>Email</Label>
                    <Input
                      id='email'
                      name='email'
                      type='email'
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='phone'>Phone</Label>
                    <Input
                      id='phone'
                      name='phone'
                      type='tel'
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label>Status</Label>
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
                      <SelectItem value='On Leave'>On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className='flex justify-between'>
                <Button
                  variant='outline'
                  type='button'
                  onClick={() => router.push('/dashboard/employees')}
                >
                  Cancel
                </Button>
                <Button
                  type='button'
                  onClick={() => setActiveTab('employment')}
                >
                  Next
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value='employment'>
            <Card>
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
                <CardDescription>
                  Enter the employee's work information
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='position'>Position</Label>
                    <Input
                      id='position'
                      name='position'
                      value={formData.position}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='department'>Department</Label>
                    <Input
                      id='department'
                      name='department'
                      value={formData.department}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='employeeNumber'>Employee Number</Label>
                    <Input
                      id='employeeNumber'
                      name='employeeNumber'
                      value={formData.employeeNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='startDate'>Start Date</Label>
                    <Input
                      id='startDate'
                      name='startDate'
                      type='date'
                      value={formData.startDate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='companyId'>Company</Label>
                  <Select
                    value={formData.companyId}
                    onValueChange={(value) =>
                      handleSelectChange('companyId', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select company' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='unassigned'>Unassigned</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='siteId'>Site</Label>
                  <Select
                    value={formData.siteId}
                    onValueChange={(value) =>
                      handleSelectChange('siteId', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select site' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='unassigned'>Unassigned</SelectItem>
                      {sites.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='departmentId'>Department</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(value) =>
                      handleSelectChange('departmentId', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select department' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='unassigned'>Unassigned</SelectItem>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
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
                  onClick={() => setActiveTab('basic')}
                >
                  Previous
                </Button>
                <Button
                  type='button'
                  onClick={() => setActiveTab('additional')}
                >
                  Next
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value='additional'>
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>
                  Enter emergency contact and medical information
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <h3 className='text-lg font-medium'>Emergency Contact</h3>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='emergencyContact.name'>Name</Label>
                      <Input
                        id='emergencyContact.name'
                        name='emergencyContact.name'
                        value={formData.emergencyContact.name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='emergencyContact.relationship'>
                        Relationship
                      </Label>
                      <Input
                        id='emergencyContact.relationship'
                        name='emergencyContact.relationship'
                        value={formData.emergencyContact.relationship}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='emergencyContact.phone'>Phone</Label>
                      <Input
                        id='emergencyContact.phone'
                        name='emergencyContact.phone'
                        type='tel'
                        value={formData.emergencyContact.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                <div className='space-y-2'>
                  <h3 className='text-lg font-medium'>Medical Information</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='medicalInfo.bloodType'>Blood Type</Label>
                      <Select
                        value={formData.medicalInfo.bloodType}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            medicalInfo: {
                              ...prev.medicalInfo,
                              bloodType: value,
                            },
                          }))
                        }
                      >
                        <SelectTrigger id='medicalInfo.bloodType'>
                          <SelectValue placeholder='Select blood type' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='unknown'>Unknown</SelectItem>
                          <SelectItem value='A+'>A+</SelectItem>
                          <SelectItem value='A-'>A-</SelectItem>
                          <SelectItem value='B+'>B+</SelectItem>
                          <SelectItem value='B-'>B-</SelectItem>
                          <SelectItem value='AB+'>AB+</SelectItem>
                          <SelectItem value='AB-'>AB-</SelectItem>
                          <SelectItem value='O+'>O+</SelectItem>
                          <SelectItem value='O-'>O-</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='medicalInfo.allergies'>
                      Allergies (comma separated)
                    </Label>
                    <Textarea
                      id='medicalInfo.allergies'
                      name='medicalInfo.allergies'
                      value={formData.medicalInfo.allergies}
                      onChange={handleInputChange}
                      placeholder='e.g., Peanuts, Penicillin, Latex'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='medicalInfo.medicalConditions'>
                      Medical Conditions (comma separated)
                    </Label>
                    <Textarea
                      id='medicalInfo.medicalConditions'
                      name='medicalInfo.medicalConditions'
                      value={formData.medicalInfo.medicalConditions}
                      onChange={handleInputChange}
                      placeholder='e.g., Asthma, Diabetes, Hypertension'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='medicalInfo.medications'>
                      Medications (comma separated)
                    </Label>
                    <Textarea
                      id='medicalInfo.medications'
                      name='medicalInfo.medications'
                      value={formData.medicalInfo.medications}
                      onChange={handleInputChange}
                      placeholder='e.g., Insulin, Ventolin, Lisinopril'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='notes'>Additional Notes</Label>
                  <Textarea
                    id='notes'
                    name='notes'
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder='Any additional information about the employee'
                  />
                </div>
              </CardContent>
              <CardFooter className='flex justify-between'>
                <Button
                  variant='outline'
                  type='button'
                  onClick={() => setActiveTab('employment')}
                >
                  Previous
                </Button>
                <Button type='button' onClick={() => setActiveTab('documents')}>
                  Next
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value='documents'>
            <Card>
              <CardHeader>
                <CardTitle>Employee Documents</CardTitle>
                <CardDescription>
                  Upload required employee documents
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {Object.values(EmployeeDocumentType).map((docType) => (
                  <div key={docType} className='space-y-2'>
                    <Label>{docType}</Label>
                    <FileUpload
                      onUploadComplete={(file) =>
                        handleFileUpload(file, docType)
                      }
                      label={`Upload ${docType}`}
                      accept='.pdf,.doc,.docx'
                      maxSize={5}
                    />
                    {formData.documents.find(
                      (doc) => doc.documentType === docType
                    ) && (
                      <p className='text-sm text-green-600'>
                        File uploaded successfully
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
              <CardFooter className='flex justify-between'>
                <Button
                  variant='outline'
                  type='button'
                  onClick={() => setActiveTab('additional')}
                >
                  Previous
                </Button>
                <Button type='submit' disabled={isLoading}>
                  <Save className='mr-2 h-4 w-4' />
                  {isLoading ? 'Saving...' : 'Save Employee'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}
