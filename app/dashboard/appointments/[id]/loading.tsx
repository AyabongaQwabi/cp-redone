import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AppointmentDetailsLoading() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6'>
        <div>
          <Skeleton className='h-10 w-48 mb-2' />
          <Skeleton className='h-4 w-64' />
        </div>
        <div className='flex space-x-2'>
          <Skeleton className='h-10 w-32' />
          <Skeleton className='h-10 w-40' />
        </div>
      </div>

      <div className='grid gap-6 mb-6'>
        <Card className='overflow-hidden border-none shadow-md'>
          <div className='bg-primary/10 p-6'>
            <div className='flex flex-col md:flex-row justify-between gap-4'>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-8 w-8 rounded-full' />
                <div>
                  <Skeleton className='h-8 w-48 mb-1' />
                  <Skeleton className='h-4 w-32' />
                </div>
              </div>
              <Skeleton className='h-6 w-24' />
            </div>
          </div>

          <CardContent className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className='flex flex-col gap-1'>
                  <Skeleton className='h-4 w-32 mb-1' />
                  <Skeleton className='h-6 w-40' />
                </div>
              ))}
            </div>

            <div className='mt-6'>
              <Skeleton className='h-4 w-24 mb-2' />
              <Skeleton className='h-20 w-full rounded-md' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>
                  <Skeleton className='h-6 w-48' />
                </CardTitle>
                <Skeleton className='h-4 w-64 mt-1' />
              </div>
              <Skeleton className='h-6 w-24' />
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
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className='overflow-hidden'>
                      <CardHeader className='pb-2'>
                        <div className='flex items-center gap-3'>
                          <Skeleton className='h-10 w-10 rounded-full' />
                          <div>
                            <Skeleton className='h-5 w-32 mb-1' />
                            <Skeleton className='h-4 w-24' />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className='pb-3'>
                        <div className='grid grid-cols-2 gap-2 text-sm mb-3'>
                          <div>
                            <Skeleton className='h-3 w-12 mb-1' />
                            <Skeleton className='h-4 w-28' />
                          </div>
                          <div>
                            <Skeleton className='h-3 w-12 mb-1' />
                            <Skeleton className='h-4 w-20' />
                          </div>
                        </div>

                        <div className='mt-2'>
                          <Skeleton className='h-24 w-full rounded-md' />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
