'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import { db, auth } from '@/lib/firebase-client';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import type { Company } from '@/app/types';
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

// South African provinces
const provinces = [
  { value: 'eastern-cape', label: 'Eastern Cape' },
  { value: 'free-state', label: 'Free State' },
  { value: 'gauteng', label: 'Gauteng' },
  { value: 'kwazulu-natal', label: 'KwaZulu-Natal' },
  { value: 'limpopo', label: 'Limpopo' },
  { value: 'mpumalanga', label: 'Mpumalanga' },
  { value: 'north-west', label: 'North West' },
  { value: 'northern-cape', label: 'Northern Cape' },
  { value: 'western-cape', label: 'Western Cape' },
];

export default function CreateSitePage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadataFields, setMetadataFields] = useState<
    { key: string; value: string }[]
  >([{ key: '', value: '' }]);
  // Add activeTab state
  const [activeTab, setActiveTab] = useState('basic');

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    companyId: '',
    status: 'Active',
    notes: '',
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
        throw new Error('You must be logged in to create a site');
      }

      if (!formData.companyId) {
        throw new Error('Please select a company for this site');
      }

      // Get company name for the selected company
      const selectedCompany = companies.find(
        (company) => company.id === formData.companyId
      );
      if (!selectedCompany) {
        throw new Error('Selected company not found');
      }

      // Process metadata
      const metadata: Record<string, string> = {};
      metadataFields.forEach((field) => {
        if (field.key.trim() && field.value.trim()) {
          metadata[field.key.trim()] = field.value.trim();
        }
      });

      // Create site in Firestore
      const siteData = {
        ...formData,
        companyName: selectedCompany.name,
        employeeCount: 0,
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, 'sites'), siteData);

      // Redirect to sites page
      router.push('/dashboard/sites');
    } catch (error) {
      console.error('Error creating site:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex items-center mb-6'>
        <Button variant='ghost' size='sm' asChild className='mr-4'>
          <Link href='/dashboard/sites'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back
          </Link>
        </Button>
        <div>
          <h1 className='text-3xl font-bold'>Add New Site</h1>
          <p className='text-gray-600'>Create a new company site</p>
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
                <CardTitle>Site Information</CardTitle>
                <CardDescription>
                  Enter the details for the new site
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
                  <Label htmlFor='name'>Site Name</Label>
                  <Input
                    id='name'
                    name='name'
                    value={formData.name}
                    onChange={handleInputChange}
                    required
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
                      <SelectItem value='Under Construction'>
                        Under Construction
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='address'>Street Address</Label>
                  <Textarea
                    id='address'
                    name='address'
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    rows={2}
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='city'>City</Label>
                    <Input
                      id='city'
                      name='city'
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='province'>Province</Label>
                    <Select
                      value={formData.province}
                      onValueChange={(value) =>
                        handleSelectChange('province', value)
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select province' />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((province) => (
                          <SelectItem
                            key={province.value}
                            value={province.value}
                          >
                            {province.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='postalCode'>Postal Code</Label>
                    <Input
                      id='postalCode'
                      name='postalCode'
                      value={formData.postalCode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className='pt-4'>
                  <h3 className='text-lg font-medium mb-2'>
                    Contact Information
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='contactName'>Contact Name</Label>
                      <Input
                        id='contactName'
                        name='contactName'
                        value={formData.contactName}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='contactEmail'>Contact Email</Label>
                      <Input
                        id='contactEmail'
                        name='contactEmail'
                        type='email'
                        value={formData.contactEmail}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='contactPhone'>Contact Phone</Label>
                      <Input
                        id='contactPhone'
                        name='contactPhone'
                        type='tel'
                        value={formData.contactPhone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='notes'>Notes</Label>
                  <Textarea
                    id='notes'
                    name='notes'
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder='Any additional information about the site'
                    rows={3}
                  />
                </div>
              </CardContent>
              <CardFooter className='flex justify-between'>
                <Button
                  variant='outline'
                  type='button'
                  onClick={() => router.push('/dashboard/sites')}
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
                <CardTitle>Site Metadata</CardTitle>
                <CardDescription>
                  Add custom fields and metadata for this site
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
                  {isLoading ? 'Creating...' : 'Create Site'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}
