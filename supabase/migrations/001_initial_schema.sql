-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  title TEXT, -- Nullable until user confirms it
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'pachai')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Veredicts table
CREATE TABLE veredicts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  pain TEXT NOT NULL,
  value TEXT NOT NULL,
  notes TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_conversations_product_id ON conversations(product_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_veredicts_product_id ON veredicts(product_id);
CREATE INDEX idx_veredicts_conversation_id ON veredicts(conversation_id);

-- Row Level Security (RLS)

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE veredicts ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Users can view their own products"
  ON products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
  ON products FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
  ON products FOR DELETE
  USING (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view conversations of their products"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = conversations.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations for their products"
  ON conversations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = conversations.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update conversations of their products"
  ON conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = conversations.product_id
      AND products.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = conversations.product_id
      AND products.user_id = auth.uid()
    )
  );

-- Messages policies
CREATE POLICY "Users can view messages of their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN products ON products.id = conversations.product_id
      WHERE conversations.id = messages.conversation_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN products ON products.id = conversations.product_id
      WHERE conversations.id = messages.conversation_id
      AND products.user_id = auth.uid()
    )
  );

-- Veredicts policies
CREATE POLICY "Users can view veredicts of their products"
  ON veredicts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = veredicts.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create veredicts for their products"
  ON veredicts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = veredicts.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update veredicts of their products"
  ON veredicts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = veredicts.product_id
      AND products.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = veredicts.product_id
      AND products.user_id = auth.uid()
    )
  );

