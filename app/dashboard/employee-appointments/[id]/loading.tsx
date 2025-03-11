import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EmployeeAppointmentDetailsLoading() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex justify-between items-center mb-6'>
        <Skeleton className='h-10 w-48' />
        <div className='flex space-x-2'>
          <Skeleton className='h-10 w-20' />
          <Skeleton className='h-10 w-40' />
        </div>
      </div>

      <div className='grid gap-6 mb-6'>
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className='h-6 w-48' />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index}>
                  <Skeleton className='h-4 w-32 mb-1' />
                  <Skeleton className='h-6 w-48' />
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
