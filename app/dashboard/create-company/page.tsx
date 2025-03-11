'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase-client';
import { db } from '@/lib/firebase-client';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { SearchableSelect } from '../../components/SearchableSelect';
import { FileUpload } from '@/components/ui/file-upload';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

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

export default function CreateCompany() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    contactEmail: '',
    contactPhone: '',
    invoicesEmail: '',
    address: '',
    town: '',
    suburb: '',
    province: '',
    logo: '',
    ndaAccepted: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // State for options
  const [industries, setIndustries] = useState<Option[]>([]);
  const [towns, setTowns] = useState<Option[]>([]);
  const [suburbs, setSuburbs] = useState<Option[]>([]);

  const fetchOptions = async () => {
    console.log('Fetching options...');
    try {
      // Fetch industries
      const industriesSnapshot = await getDocs(collection(db, 'industries'));
      const industriesData = industriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setIndustries(industriesData);

      // Fetch towns
      const townsSnapshot = await getDocs(collection(db, 'towns'));
      const townsData = townsSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setTowns(townsData);
      console.log('Towns:', townsData);

      // Fetch suburbs
      const suburbsSnapshot = await getDocs(collection(db, 'suburbs'));
      const suburbsData = suburbsSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setSuburbs(suburbsData);
    } catch (error) {
      console.error('Error fetching options:', error);
      setError('Failed to load form options');
    }
  };
  // Fetch options from Firebase
  useEffect(() => {
    fetchOptions();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, ndaAccepted: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.ndaAccepted) {
      setError('You must accept the Non-Disclosure Agreement to continue');
      setIsLoading(false);
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to create a company');
      }

      // Create company in Firestore
      await addDoc(collection(db, 'companies'), {
        ...formData,
        userId: user.uid,
        employeeCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating company:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTown = async (val: string) => {
    try {
      // Add the new town to Firestore
      const docRef = await addDoc(collection(db, 'towns'), {
        name: val,
      });

      // Update the local state with the new town
      const newTown = { value: docRef.id, label: val };
      setTowns((prevTowns) => [...prevTowns, newTown]);

      // Return the new town to update the select input
      toast({
        title: 'Success',
        description: 'New town created successfully',
        variant: 'default',
      });
      await fetchOptions();
      return newTown;
    } catch (error) {
      console.error('Error creating town:', error);
      toast({
        title: 'Error',
        description: 'Failed to create town. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleCreateSuburb = async (val: string) => {
    try {
      // Add the new suburb to Firestore
      const docRef = await addDoc(collection(db, 'suburbs'), {
        name: val,
      });

      // Update the local state with the new suburb
      const newSuburb = { value: docRef.id, label: val };
      setSuburbs((prevSuburbs) => [...prevSuburbs, newSuburb]);

      // Return the new suburb to update the select input
      toast({
        title: 'Success',
        description: 'New suburb created successfully',
        variant: 'default',
      });
      await fetchOptions();
      return newSuburb;
    } catch (error) {
      console.error('Error creating suburb:', error);
      toast({
        title: 'Error',
        description: 'Failed to create suburb. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleCreateIndustry = async (val: string) => {
    try {
      // Add the new industry to Firestore
      const docRef = await addDoc(collection(db, 'industries'), {
        name: val,
      });

      // Update the local state with the new industry
      const newIndustry = { value: docRef.id, label: val };
      setIndustries((prevIndustries) => [...prevIndustries, newIndustry]);

      // Return the new industry to update the select input
      toast({
        title: 'Success',
        description: 'New industry created successfully',
        variant: 'default',
      });
      await fetchOptions();
      return newIndustry;
    } catch (error) {
      console.error('Error creating industry:', error);
      toast({
        title: 'Error',
        description: 'Failed to create industry. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6'>Create Company</h1>

      {error && (
        <div className='mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className='grid grid-cols-1 md:grid-cols-2 gap-6'
      >
        <div>
          <Label htmlFor='name'>Company Name</Label>
          <Input
            id='name'
            name='name'
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor='industry'>Industry</Label>
          <SearchableSelect
            options={industries}
            value={formData.industry}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, industry: value }))
            }
            placeholder='Select or create an industry'
            onCreateNew={handleCreateIndustry}
          />
        </div>

        <div>
          <Label htmlFor='contactEmail'>Contact Email</Label>
          <Input
            id='contactEmail'
            name='contactEmail'
            type='email'
            value={formData.contactEmail}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor='invoicesEmail'>Invoices Email</Label>
          <Input
            id='invoicesEmail'
            name='invoicesEmail'
            type='email'
            value={formData.invoicesEmail}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <Label htmlFor='contactPhone'>Contact Phone</Label>
          <Input
            id='contactPhone'
            name='contactPhone'
            type='tel'
            value={formData.contactPhone}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <Label htmlFor='address'>Street Address</Label>
          <Textarea
            id='address'
            name='address'
            value={formData.address}
            onChange={handleInputChange}
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor='town'>Town</Label>
          <SearchableSelect
            options={towns}
            value={formData.town}
            onChange={(value) => {
              setFormData((prev) => ({ ...prev, town: value }));
            }}
            placeholder='Select or create a town'
            onCreateNew={handleCreateTown}
          />
        </div>

        <div>
          <Label htmlFor='suburb'>Suburb</Label>
          <SearchableSelect
            options={suburbs}
            value={formData.suburb}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, suburb: value }))
            }
            placeholder='Select or create a suburb'
            onCreateNew={handleCreateSuburb}
          />
        </div>

        <div>
          <Label htmlFor='province'>Province</Label>
          <select
            id='province'
            name='province'
            value={formData.province}
            onChange={handleInputChange}
            className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500'
          >
            <option value=''>Select a province</option>
            {provinces.map((province) => (
              <option key={province.value} value={province.value}>
                {province.label}
              </option>
            ))}
          </select>
        </div>

        <div className='md:col-span-2'>
          <FileUpload
            label='Company Logo (optional)'
            accept='image/*'
            maxSize={2}
            onUploadComplete={(url) =>
              setFormData((prev) => ({ ...prev, logo: url }))
            }
            value={formData.logo}
          />
        </div>

        <div className='md:col-span-2 flex items-center space-x-2'>
          <Checkbox
            id='ndaAccepted'
            checked={formData.ndaAccepted}
            onCheckedChange={handleCheckboxChange}
          />
          <Label htmlFor='ndaAccepted' className='text-sm text-gray-700'>
            I agree to the Non-Disclosure Agreement and terms of service
          </Label>
        </div>

        <div className='md:col-span-2'>
          <Button type='submit' disabled={isLoading} className='w-full'>
            {isLoading ? 'Creating...' : 'Create Company'}
          </Button>
        </div>
      </form>
    </div>
  );
}
