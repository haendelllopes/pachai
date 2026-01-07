import ProductsSidebar from '@/app/components/sidebar/ProductsSidebar'
import ProtectedRoute from '@/app/components/auth/ProtectedRoute'
import { ProductsProvider } from '@/app/contexts/ProductsContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <ProductsProvider>
        <div style={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
        }}>
          <ProductsSidebar />
          <main style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {children}
          </main>
        </div>
      </ProductsProvider>
    </ProtectedRoute>
  )
}

