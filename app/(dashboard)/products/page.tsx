import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProductsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .order('created_at', { ascending: false })

  // If no products, redirect to create first product
  if (!products || products.length === 0) {
    redirect('/products/new')
  }

  // If products exist, redirect to first product
  redirect(`/products/${products[0].id}`)
}

