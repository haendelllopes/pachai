import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatInterface from '@/app/components/chat/ChatInterface'

interface ProductPageProps {
  params: Promise<{
    productId: string
  }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productId } = await params
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify product belongs to user
  const { data: product } = await supabase
    .from('products')
    .select('id, name')
    .eq('id', productId)
    .eq('user_id', user.id)
    .single()

  if (!product) {
    redirect('/products')
  }

  // Get or create conversation (V1: 1 product = 1 conversation)
  let { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('product_id', productId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  // If no conversation exists, create one
  if (!conversation) {
    const { data: newConversation, error } = await supabase
      .from('conversations')
      .insert({ product_id: productId })
      .select()
      .single()

    if (error || !newConversation) {
      console.error('Error creating conversation:', error)
      redirect('/products')
    }

    conversation = newConversation
  }

  // Final check to ensure conversation exists
  if (!conversation) {
    redirect('/products')
  }

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
          {product.name}
        </h1>
      </div>
      
      <ChatInterface
        productId={productId}
        conversationId={conversation.id}
      />
    </div>
  )
}

