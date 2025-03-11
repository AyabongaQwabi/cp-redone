export interface Appointment {
  id: string;
  purchaseOrderNumber: string;
  companyId: string;
  companyName?: string;
  billingCompanyId: string;
  billingCompanyName?: string;
  clinicId: string;
  clinicName?: string;
  date: string;
  employeeCount: number;
  maxEmployeeCount?: number;
  status: 'Approved' | 'In Progress' | 'Complete' | 'Declined' | 'Pending';
  notes?: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AppointmentEmployee {
  id: string;
  appointmentId: string;
  employeeId: string;
  employeeName?: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  maxDailyAppointments: number;
  doctors: string[]; // Array of doctor IDs
  admins: string[]; // Array of admin user IDs
  status: 'Active' | 'Inactive';
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  contactEmail: string;
  contactPhone?: string;
  invoicesEmail?: string;
  address?: string;
  town?: string;
  suburb?: string;
  province?: string;
  logo?: string;
  employeeCount: number;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Site {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  companyId: string;
  companyName?: string;
  employeeCount: number;
  status: 'Active' | 'Inactive' | 'Under Construction';
  notes?: string;
  metadata?: Record<string, string>;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SiteEmployee {
  id: string;
  siteId: string;
  employeeId: string;
  assignmentDate: string;
  role?: string;
  isPrimary: boolean;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  companyName?: string;
  managerId?: string;
  managerName?: string;
  employeeCount: number;
  budget?: number;
  location?: string;
  metadata?: Record<string, string>;
  status: 'Active' | 'Inactive' | 'Restructuring';
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DepartmentEmployee {
  id: string;
  departmentId: string;
  employeeId: string;
  assignmentDate: string;
  role?: string;
  isManager: boolean;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  cellPhone?: string;
  position: string;
  occupation?: string;
  governmentIdNumber?: string;
  department?: string;
  departmentId?: string;
  employeeNumber?: string;
  companyId?: string;
  companyName?: string;
  startDate?: string;
  status: 'Active' | 'Inactive' | 'On Leave' | 'Onboarding';
  dataProcessingConsent?: boolean;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalInfo?: {
    bloodType?: string;
    allergies?: string[];
    medicalConditions?: string[];
    medications?: string[];
  };
  documents?: EmployeeDocument[];
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  name: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
  documentType: EmployeeDocumentType;
  status: 'Pending' | 'Approved' | 'Rejected';
  notes?: string;
  uploadDate: Date;
  expiryDate?: Date;
  userId: string;
}

export enum EmployeeDocumentType {
  MEDICAL_CERTIFICATE = 'Medical Certificate of Fitness',
  JOB_SPECIFICATION = 'Man Job Spec',
  HEIGHTS_SPECIFICATION = 'Man Job Spec for Working at Heights and Confined Spaces',
  NDA = 'Non-disclosure agreement',
  HAZARDOUS_WORK_RECORD = 'Record of Hazardous Work DMR',
}

export interface QuotationData {
  appointmentType: string;
  additionalRequirements: string;
  totalCost: number;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'client' | 'staff';
  avatar?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  status: 'active' | 'inactive';
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  recipientId: string;
  recipientName?: string;
  subject: string;
  content: string;
  isRead: boolean;
  attachments?: {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
  }[];
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: 'published' | 'draft';
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface EmployeeAppointment {
  id: string;
  appointmentId: string;
  employeeId: string;
  companyId: string;
  companyName: string;
  clinicId: string;
  clinicName: string;
  date: string;
  status: 'Approved' | 'In Progress' | 'Complete' | 'Declined' | 'Pending';
  notes?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  email: string;
  phone: string;
  clinicId?: string;
  clinicName?: string;
  status: 'Active' | 'Inactive';
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeAppointment {
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
