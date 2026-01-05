import ChatInterface from '@/app/components/chat/ChatInterface'

interface ProductPageProps {
  params: Promise<{
    productId: string
  }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productId } = await params

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        borderBottom: '1px solid #e5e5e5',
        padding: '1rem 2rem',
        background: '#ffffff',
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 600,
        }}>
          Produto {productId}
        </h1>
      </div>
      
      <ChatInterface
        productId={productId}
        conversationId=""
      />
    </div>
  )
}

